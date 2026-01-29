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

export function useInviteUser(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (email: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ boardId, email }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to invite user')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Invite sent successfully')
      // Show the invite link to the user
      if (data.inviteLink) {
        navigator.clipboard.writeText(data.inviteLink)
        toast.info('Invite link copied to clipboard!')
      }
      queryClient.invalidateQueries({ queryKey: ['board-members', boardId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to invite user')
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
      // Get the invite
      const { data: invite, error: inviteError } = await supabase
        .from('board_invites')
        .select('*')
        .eq('token', token)
        .single()

      if (inviteError || !invite) {
        throw new Error('Invalid or expired invite')
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Add user to board_members
      const { error: memberError } = await supabase
        .from('board_members')
        .insert({
          board_id: invite.board_id,
          user_id: user.id,
          role: 'member',
        })

      if (memberError) {
        // Check if already a member
        if (memberError.code === '23505') {
          throw new Error('You are already a member of this board')
        }
        throw memberError
      }

      // Delete the invite
      await supabase
        .from('board_invites')
        .delete()
        .eq('token', token)

      return invite.board_id
    },
    onSuccess: () => {
      toast.success('Successfully joined the board!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to join board')
    },
  })
}
