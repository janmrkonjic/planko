import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useJoinBoard } from '@/hooks/useBoardMembers'
import { useAuth } from '@/hooks/useAuth'

export function JoinPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const joinBoard = useJoinBoard()
  const { session, loading } = useAuth()

  const token = searchParams.get('token')

  useEffect(() => {
    // Wait for auth to load
    if (loading) return

    // No token, redirect to dashboard
    if (!token) {
      navigate('/dashboard')
      return
    }

    // Not authenticated, redirect to auth page with return URL
    if (!session) {
      const returnUrl = `/join?token=${token}`
      navigate(`/?redirect=${encodeURIComponent(returnUrl)}`)
      return
    }

    // Authenticated, attempt to join the board
    joinBoard.mutate(token, {
      onSuccess: (boardId) => {
        // Redirect to the board
        navigate(`/board/${boardId}`)
      },
      onError: () => {
        // Redirect to dashboard on error
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      },
    })
  }, [token, session, loading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <div>
          <h2 className="text-2xl font-bold">
            {!session ? 'Redirecting to login...' : 'Joining Board...'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {!session 
              ? 'Please log in or sign up to accept the invitation'
              : 'Please wait while we add you to the board'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
