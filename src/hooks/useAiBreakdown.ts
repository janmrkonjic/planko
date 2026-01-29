import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

interface UseAiBreakdownProps {
  taskId: string
  taskTitle: string
  taskDescription?: string
}

export function useAiBreakdown() {
  const [isGenerating, setIsGenerating] = useState(false)
  const queryClient = useQueryClient()

  const generateSubtasks = async ({ taskId, taskTitle, taskDescription }: UseAiBreakdownProps) => {
    setIsGenerating(true)
    console.log("Generating subtasks for:", { taskId, taskTitle })
    try {
      const { data, error } = await supabase.functions.invoke('generate-subtasks', {
        body: { taskId, taskTitle, taskDescription }
      })

      console.log("Edge function response:", { data, error })

      if (error) throw error
      
      // Invalidate query to refetch subtasks
      console.log("Invalidating subtasks query...")
      await queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      console.log("Query invalidated.")
      return data
    } catch (error) {
      console.error('Failed to generate subtasks:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateSubtasks,
    isGenerating
  }
}
