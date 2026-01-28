import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoardsQuery, useCreateBoardMutation } from '@/hooks/useBoards'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const { data: boards, isLoading, error } = useBoardsQuery()
  const createBoardMutation = useCreateBoardMutation()
  
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) return

    createBoardMutation.mutate(newBoardTitle, {
      onSuccess: () => {
        setNewBoardTitle('')
        setIsDialogOpen(false)
      },
    })
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const userInitials = session?.user.email?.substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-6 shadow-sm">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            Planko
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user.user_metadata?.avatar_url} alt="User" />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Workspaces</h1>
            <p className="text-muted-foreground mt-1">
              Manage your boards and projects.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Board
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateBoard}>
                <DialogHeader>
                  <DialogTitle>Create Board</DialogTitle>
                  <DialogDescription>
                    Give your new board a name. You can change this later.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={newBoardTitle}
                      onChange={(e) => setNewBoardTitle(e.target.value)}
                      className="col-span-3"
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createBoardMutation.isPending}>
                    {createBoardMutation.isPending ? 'Creating...' : 'Create Board'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/15 p-6 text-destructive">
             Error loading boards: {(error as Error).message}
          </div>
        ) : boards?.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50/50 p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <h3 className="mt-4 text-lg font-semibold">No boards created</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                You haven't created any boards yet. Create one to get started.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Board
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {boards?.map((board) => (
              <Card 
                key={board.id} 
                className="group relative cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{board.title}</CardTitle>
                  <CardDescription>
                     Created {new Date(board.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {/* Placeholder for task count or recent activity */}
                    Manage tasks and workflows.
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="secondary" className="w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    View Board
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

