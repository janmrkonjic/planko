import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Task, Subtask } from '@/types'
import { toast } from 'sonner'

export function useTaskDetails(taskId: string | undefined) {
  const queryClient = useQueryClient()

  // Fetch Task Details (Description)
  const { data: task, isLoading: isTaskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required')
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()
      if (error) throw error
      return data as Task
    },
    enabled: !!taskId,
  })

  // Fetch Subtasks
  const { data: subtasks, isLoading: isSubtasksLoading } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required')
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index')
      if (error) throw error
      return data as Subtask[]
    },
    enabled: !!taskId,
  })

  // Update Task Description
  const updateTask = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      if (!taskId) return
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['board'] }) // Invalidate board to update description preview if needed
      toast.success('Task updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`)
    },
  })

  // Add Subtask
  const addSubtask = useMutation({
    mutationFn: async (title: string) => {
      if (!taskId) return
      
      const { data: existingSubtasks } = await supabase
        .from('subtasks')
        .select('order_index')
        .eq('task_id', taskId)
        .order('order_index', { ascending: false })
        .limit(1)
        
      const nextOrderIndex = (existingSubtasks?.[0]?.order_index ?? -1) + 1

      const { error } = await supabase
        .from('subtasks')
        .insert({
          task_id: taskId,
          title,
          is_completed: false,
          order_index: nextOrderIndex
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Subtask added successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to add subtask: ${error.message}`)
    }
  })

  // Toggle Subtask
  const toggleSubtask = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('subtasks')
        .update({ is_completed: isCompleted })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: ['subtasks', taskId] })
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(['subtasks', taskId])
      
      queryClient.setQueryData<Subtask[]>(['subtasks', taskId], (old) => 
        old?.map(subtask => 
          subtask.id === id ? { ...subtask, is_completed: isCompleted } : subtask
        )
      )
      
      return { previousSubtasks }
    },
    onError: (_err, _newSubtask, context) => {
      queryClient.setQueryData(['subtasks', taskId], context?.previousSubtasks)
      toast.error('Failed to update subtask')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    },
  })

  // Delete Subtask
  const deleteSubtask = useMutation({
    mutationFn: async (subtaskId: string) => {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Subtask deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete subtask: ${error.message}`)
    },
  })

  return {
    task,
    subtasks,
    isLoading: isTaskLoading || isSubtasksLoading,
    updateTask: updateTask.mutate,
    addSubtask: addSubtask.mutate,
    toggleSubtask: toggleSubtask.mutate,
    deleteSubtask: deleteSubtask.mutate,
  }
}
