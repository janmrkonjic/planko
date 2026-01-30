import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { BoardDetails, Task } from '../types'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

export function useBoardDetails(boardId: string | undefined) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: board, isLoading, error } = useQuery({
    queryKey: ['board', boardId, user?.id],
    queryFn: async () => {
      if (!boardId) throw new Error('Board ID is required')

      // Fetch board details
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single()

      if (boardError) throw boardError

      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('order_index')

      if (columnsError) throw columnsError

      // Fetch tasks for these columns
      const columnIds = columnsData.map(col => col.id)
      let tasksData: Task[] = []
      
      if (columnIds.length > 0) {
        const { data, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .in('column_id', columnIds)
          .order('order_index')
        
        if (tasksError) throw tasksError
        tasksData = data || []
      }

      // Merge data
      const columnsWithTasks = columnsData.map(col => ({
        ...col,
        tasks: tasksData.filter(task => task.column_id === col.id)
      }))

      return {
        ...boardData,
        columns: columnsWithTasks,
      } as BoardDetails
    },
    enabled: !!boardId,
    refetchInterval: 3000, // Poll every 3 seconds for near-real-time updates
    refetchIntervalInBackground: false, // Pause polling when tab is inactive
  })

  const addColumn = useMutation({
    mutationFn: async (title: string) => {
      if (!boardId) throw new Error('Board ID is required')
      
       // Get max order_index
      const { data: existingColumns } = await supabase
        .from('columns')
        .select('order_index')
        .eq('board_id', boardId)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrderIndex = (existingColumns?.[0]?.order_index ?? -1) + 1

      const { data, error } = await supabase
        .from('columns')
        .insert({
          board_id: boardId,
          title,
          order_index: nextOrderIndex
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (title: string) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })

      // Snapshot the previous value
      const previousBoard = queryClient.getQueryData<BoardDetails>(['board', boardId, user?.id])

      // Optimistically update the cache
      if (previousBoard) {
        const tempId = `temp-${Date.now()}`
        const nextOrderIndex = previousBoard.columns.length > 0 
          ? Math.max(...previousBoard.columns.map(col => col.order_index)) + 1 
          : 0

        const optimisticColumn = {
          id: tempId,
          board_id: boardId!,
          title,
          order_index: nextOrderIndex,
          created_at: new Date().toISOString(),
          tasks: []
        }

        queryClient.setQueryData<BoardDetails>(['board', boardId, user?.id], {
          ...previousBoard,
          columns: [...previousBoard.columns, optimisticColumn]
        })
      }

      // Return context with the snapshot
      return { previousBoard }
    },
    onError: (error: Error, _title, context) => {
      // Roll back to the previous value on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', boardId, user?.id], context.previousBoard)
      }
      toast.error(`Failed to create column: ${error.message}`)
    },
    onSuccess: () => {
      // Invalidate to fetch the real data with actual ID
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      toast.success('Column created successfully')
    },
  })

  const deleteColumn = useMutation({
    mutationFn: async (columnId: string) => {
      const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      toast.success('Column deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete column: ${error.message}`)
    },
  })

  const updateColumn = useMutation({
    mutationFn: async ({ columnId, updates }: { columnId: string; updates: { title?: string } }) => {
      const { error } = await supabase
        .from('columns')
        .update(updates)
        .eq('id', columnId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      toast.success('Column updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update column: ${error.message}`)
    },
  })

  const addTask = useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
        // Get max order_index for this column
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('order_index')
        .eq('column_id', columnId)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrderIndex = (existingTasks?.[0]?.order_index ?? -1) + 1

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          column_id: columnId,
          title,
          order_index: nextOrderIndex
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ columnId, title }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })

      // Snapshot the previous value
      const previousBoard = queryClient.getQueryData<BoardDetails>(['board', boardId, user?.id])

      // Optimistically update the cache
      if (previousBoard) {
        const tempId = `temp-task-${Date.now()}`
        const column = previousBoard.columns.find(col => col.id === columnId)
        
        if (column) {
          const nextOrderIndex = column.tasks.length > 0
            ? Math.max(...column.tasks.map(task => task.order_index)) + 1
            : 0

          const optimisticTask: Task = {
            id: tempId,
            column_id: columnId,
            title,
            description: undefined,
            priority: 'medium' as const,
            due_date: null,
            assignee_id: null,
            order_index: nextOrderIndex,
            created_at: new Date().toISOString(),
          }

          const updatedColumns = previousBoard.columns.map(col =>
            col.id === columnId
              ? { ...col, tasks: [...col.tasks, optimisticTask] }
              : col
          )

          queryClient.setQueryData<BoardDetails>(['board', boardId, user?.id], {
            ...previousBoard,
            columns: updatedColumns
          })
        }
      }

      // Return context with the snapshot
      return { previousBoard }
    },
    onError: (error: Error, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', boardId, user?.id], context.previousBoard)
      }
      toast.error(`Failed to create task: ${error.message}`)
    },
    onSuccess: () => {
      // Invalidate to fetch the real data with actual ID
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      toast.success('Task created successfully')
    },
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      toast.success('Task deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`)
    },
  })

  const moveTask = useMutation({
    mutationFn: async ({ columnId, allTasks }: { 
      columnId: string; 
      allTasks: Task[];
    }) => {
      
      // Update all tasks in the column with sequential order_index values
      // The array is already in the correct order, so we just assign 0, 1, 2, 3...
      const updates = allTasks.map((task, index) => 
        supabase
          .from('tasks')
          .update({ 
            column_id: columnId, // Set the correct column_id (crucial for cross-column moves)
            order_index: index 
          })
          .eq('id', task.id)
      )

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)
      
      
      if (errors.length > 0) {
        throw new Error('Failed to update task order indices')
      }
    },
    onSuccess: () => {
      // Invalidate to sync with database
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to move task: ${error.message}`)
      // Invalidate to revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })

  return {
    board,
    isLoading,
    error,
    addColumn: addColumn.mutate,
    deleteColumn: deleteColumn.mutate,
    updateColumn: updateColumn.mutate,
    addTask: addTask.mutate,
    deleteTask: deleteTask.mutate,
    moveTask: moveTask.mutate,
  }
}
