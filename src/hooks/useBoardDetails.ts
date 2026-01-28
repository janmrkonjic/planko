import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { BoardDetails, Column, Task } from '../types'

export function useBoardDetails(boardId: string | undefined) {
  const queryClient = useQueryClient()

  const { data: board, isLoading, error } = useQuery({
    queryKey: ['board', boardId],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })

  const moveTask = useMutation({
    mutationFn: async ({ taskId, columnId, orderIndex }: { taskId: string; columnId: string; orderIndex: number }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ column_id: columnId, order_index: orderIndex })
        .eq('id', taskId)

      if (error) throw error
    },
    onSuccess: () => {
        // We will manage optimistic updates manually in onDragEnd, so we might not need to invalidate immediately 
        // if we want to avoid flickering, but eventually we should sync.
        // For now, let's invalidate to be safe, but debouncing this might be better in production.
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })

  return {
    board,
    isLoading,
    error,
    addColumn: addColumn.mutate,
    addTask: addTask.mutate,
    moveTask: moveTask.mutate,
  }
}
