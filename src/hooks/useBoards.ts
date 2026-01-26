import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBoards, createBoard } from '../lib/api'

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
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: BOARD_KEYS.all })
    },
  })
}
