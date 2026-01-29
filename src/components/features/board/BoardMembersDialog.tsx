import { Users, X, Crown, Link2, Copy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBoardMembers, useGenerateInviteLink, useRemoveMember } from '@/hooks/useBoardMembers'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'


interface BoardMembersDialogProps {
  boardId: string
  ownerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BoardMembersDialog({ boardId, ownerId, open, onOpenChange }: BoardMembersDialogProps) {
  const { user } = useAuth()
  const { data: members, isLoading } = useBoardMembers(boardId)
  const generateLink = useGenerateInviteLink(boardId)
  const removeMember = useRemoveMember(boardId)

  const isOwner = user?.id === ownerId

  const handleCopyLink = async () => {
    try {
      const token = await generateLink.mutateAsync()
      const inviteLink = `${window.location.origin}/join?token=${token}`
      await navigator.clipboard.writeText(inviteLink)
      toast.success('Invite link copied to clipboard!')
    } catch (error) {
      // Error already handled by mutation
    }
  }

  const handleRemove = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMember.mutate(memberId)
    }
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return '??'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Board Members
          </DialogTitle>
          <DialogDescription>
            Manage who has access to this board
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Link Section */}
          {isOwner && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Share Board</label>
              <div className="flex flex-col gap-2 p-4 rounded-lg border bg-secondary/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  <span>Anyone with this link can join the board</span>
                </div>
                <Button 
                  onClick={handleCopyLink} 
                  disabled={generateLink.isPending}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {generateLink.isPending ? 'Generating...' : 'Copy Invite Link'}
                </Button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Members ({members?.length || 0})
            </label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading members...
                </div>
              ) : members && members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(
                            member.profile?.full_name || member.profile?.username,
                            member.profile?.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.profile?.full_name || member.profile?.username || member.profile?.email || 'Unknown User'}
                          </p>
                          {member.role === 'owner' && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        {member.profile?.email && (
                          <p className="text-sm text-muted-foreground">
                            {member.profile.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Remove button (only for owner, can't remove self or other owners) */}
                    {isOwner && member.role !== 'owner' && member.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(member.id)}
                        disabled={removeMember.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No members yet
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
