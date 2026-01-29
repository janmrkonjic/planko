import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBoards, createBoard, deleteBoard, updateBoard } from '../lib/api'
import { toast } from 'sonner'
import type { Board } from '../types'

export const BOARD_KEYS = {
  all: ['boards'] as const,
}

export function useBoardsQuery() {
  return useQuery({
    queryKey: BOARD_KEYS.all,
    queryFn: getBoards,
  })
}

export function useCreateBoardMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (title: string) => createBoard(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARD_KEYS.all })
      toast.success('Board created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create board: ${error.message}`)
    },
  })
}

export function useDeleteBoardMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (boardId: string) => deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARD_KEYS.all })
      toast.success('Board deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete board: ${error.message}`)
    },
  })
}

export function useUpdateBoardMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ boardId, updates }: { boardId: string; updates: Partial<Board> }) => 
      updateBoard(boardId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BOARD_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] })
      toast.success('Board updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update board: ${error.message}`)
    },
  })
}
