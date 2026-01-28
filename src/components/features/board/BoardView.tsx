import { useParams } from 'react-router-dom'
import { useBoardDetails } from '@/hooks/useBoardDetails'
import Column from './Column'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useQueryClient } from '@tanstack/react-query'

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>()
  const { board, isLoading, error, addColumn, addTask, moveTask } = useBoardDetails(boardId)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const queryClient = useQueryClient()

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    
    // Dropped outside or no change
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Optimistic Update
    if (!board) return

    const newBoard = { ...board }
    const sourceColumn = newBoard.columns.find(col => col.id === source.droppableId)
    const destColumn = newBoard.columns.find(col => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    // Remove from source
    const [movedTask] = sourceColumn.tasks.splice(source.index, 1)

    // Insert into destination
    destColumn.tasks.splice(destination.index, 0, movedTask)

    // Update query cache immediately
    queryClient.setQueryData(['board', boardId], newBoard)

    // Persist to DB
    moveTask({
      taskId: draggableId,
      columnId: destColumn.id,
      orderIndex: destination.index // Simplification: we rely on index for now, ideally strictly managed order_index
    })
  }

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColumnTitle.trim()) return

    addColumn(newColumnTitle)
    setNewColumnTitle("")
    setIsAddingColumn(false)
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading board...</div>
  }

  if (error || !board) {
    return <div className="flex h-screen items-center justify-center text-red-500">Error loading board</div>
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-background">
        {/* Board Header */}
        <div className="h-14 border-b flex items-center px-6 shrink-0">
          <h1 className="text-xl font-bold">{board.title}</h1>
        </div>

        {/* Board Content (Horizontal Scroll) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full p-6 flex items-start">
            
            {/* Columns */}
            {board.columns.map((column) => (
              <Column 
                key={column.id} 
                column={column} 
                onAddTask={(columnId, title) => addTask({ columnId, title })} 
              />
            ))}

            {/* Add Column Button */}
            <div className="w-80 flex-shrink-0">
              {isAddingColumn ? (
                <form onSubmit={handleAddColumn} className="bg-secondary/30 p-2 rounded-lg">
                  <Input
                    autoFocus
                    placeholder="Enter column title..."
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    className="mb-2 h-8 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" className="h-7 text-xs">Add Column</Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => setIsAddingColumn(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-10 border-dashed bg-transparent hover:bg-secondary/20"
                  onClick={() => setIsAddingColumn(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Column
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </DragDropContext>
  )
}
