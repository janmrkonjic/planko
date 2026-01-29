import { useParams } from 'react-router-dom'
import { useBoardDetails } from '@/hooks/useBoardDetails'
import { useUpdateBoardMutation } from '@/hooks/useBoards'
import Column from './Column'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X, Search, AlertCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useQueryClient } from '@tanstack/react-query'
import type { Priority } from '@/types'

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>()
  const { board, isLoading, error, addColumn, addTask, moveTask, deleteColumn, updateColumn, deleteTask } = useBoardDetails(boardId)
  const updateBoardMutation = useUpdateBoardMutation()
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  
  const queryClient = useQueryClient()
  
  // Check if filtering is active
  const isFiltering = searchQuery.trim() !== '' || priorityFilter !== 'all'

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

  const handleStartEditingTitle = () => {
    if (board) {
      setEditedTitle(board.title)
      setIsEditingTitle(true)
    }
  }

  const handleSaveTitle = () => {
    if (!boardId || !editedTitle.trim() || editedTitle === board?.title) {
      setIsEditingTitle(false)
      return
    }

    updateBoardMutation.mutate({
      boardId,
      updates: { title: editedTitle }
    }, {
      onSuccess: () => {
        setIsEditingTitle(false)
      }
    })
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
    }
  }

  // Filter board data based on search and priority
  const filteredBoard = useMemo(() => {
    if (!board) return null
    if (!isFiltering) return board

    const filtered = {
      ...board,
      columns: board.columns.map(column => ({
        ...column,
        tasks: column.tasks.filter(task => {
          // Search filter (case-insensitive)
          const matchesSearch = searchQuery.trim() === '' || 
            task.title.toLowerCase().includes(searchQuery.toLowerCase())
          
          // Priority filter
          const matchesPriority = priorityFilter === 'all' || 
            task.priority === priorityFilter
          
          return matchesSearch && matchesPriority
        })
      }))
    }
    
    return filtered
  }, [board, searchQuery, priorityFilter, isFiltering])

  const handleClearFilters = () => {
    setSearchQuery('')
    setPriorityFilter('all')
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading board...</div>
  }

  if (error || !board) {
    return <div className="flex h-screen items-center justify-center text-red-500">Error loading board</div>
  }

  const displayBoard = filteredBoard || board

  return (
    <DragDropContext onDragEnd={isFiltering ? () => {} : handleDragEnd}>
      <div className="flex flex-col h-screen bg-background">
        {/* Board Header */}
        <div className="h-14 border-b flex items-center px-6 shrink-0">
          {isEditingTitle ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleTitleKeyDown}
              className="text-xl font-bold h-10 max-w-md"
              autoFocus
            />
          ) : (
            <h1 
              className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
              onClick={handleStartEditingTitle}
            >
              {board.title}
            </h1>
          )}
        </div>

        {/* Search and Filter Toolbar */}
        <div className="border-b px-6 py-3 bg-secondary/20">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as 'all' | Priority)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {isFiltering && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Warning when drag is disabled */}
          {isFiltering && (
            <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>Drag and drop is disabled while filters are active. Clear filters to reorder tasks.</span>
            </div>
          )}
        </div>

        {/* Board Content (Horizontal Scroll) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full p-6 flex items-start">
            
            {/* Columns */}
            {displayBoard?.columns.map((column) => (
              <Column 
                key={column.id} 
                column={column} 
                onAddTask={(columnId, title) => addTask({ columnId, title })}
                onDeleteColumn={deleteColumn}
                onUpdateColumn={updateColumn}
                onDeleteTask={deleteTask}
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
