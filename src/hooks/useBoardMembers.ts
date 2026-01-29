import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BoardMember } from '@/types'
import { toast } from 'sonner'

export function useBoardMembers(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board-members', boardId],
    queryFn: async () => {
      if (!boardId) throw new Error('Board ID is required')

      const { data, error } = await supabase
        .from('board_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('board_id', boardId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as (BoardMember & { profile: any })[]
    },
    enabled: !!boardId,
  })
}

export function useGenerateInviteLink(boardId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('generate_invite_link', { p_board_id: boardId })

      if (error) throw error
      return data as string // Returns the token (uuid)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate invite link')
    },
  })
}


export function useRemoveMember(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Member removed successfully')
      queryClient.invalidateQueries({ queryKey: ['board-members', boardId] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove member: ${error.message}`)
    },
  })
}

export function useJoinBoard() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data: boardId, error } = await supabase
        .rpc('join_board_via_token', { invite_token: token })

      if (error) throw error
      return boardId as string
    },
    onSuccess: () => {
      toast.success('Successfully joined the board!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to join board')
    },
  })
}

