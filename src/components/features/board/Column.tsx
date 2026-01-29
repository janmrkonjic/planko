import { useState } from "react"
import { Column as ColumnType, Task } from "@/types"
import TaskCard from "./TaskCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, MoreVertical } from "lucide-react"
import { Droppable } from "@hello-pangea/dnd"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ColumnProps {
  column: ColumnType & { tasks: Task[] }
  onAddTask: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
  onUpdateColumn: (params: { columnId: string; updates: { title?: string } }) => void
  onDeleteTask: (taskId: string) => void
}

export default function Column({ column, onAddTask, onDeleteColumn, onUpdateColumn, onDeleteTask }: ColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(column.title)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    onAddTask(column.id, newTaskTitle)
    setNewTaskTitle("")
    setIsAddingTask(false)
  }

  const handleStartEditingTitle = () => {
    setEditedTitle(column.title)
    setIsEditingTitle(true)
  }

  const handleSaveTitle = () => {
    if (!editedTitle.trim() || editedTitle === column.title) {
      setIsEditingTitle(false)
      return
    }

    onUpdateColumn({
      columnId: column.id,
      updates: { title: editedTitle }
    })
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
    }
  }

  const handleDeleteColumn = () => {
    onDeleteColumn(column.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <div className="w-80 flex-shrink-0 flex flex-col max-h-full bg-secondary/30 rounded-lg p-2 mr-4">
        <div className="flex items-center justify-between p-2 mb-2">
          {isEditingTitle ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleTitleKeyDown}
              className="h-7 text-sm font-semibold"
              autoFocus
            />
          ) : (
            <h3 className="font-semibold text-sm flex-1">{column.title}</h3>
          )}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{column.tasks.length}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleStartEditingTitle}>
                  Rename Column
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 overflow-y-auto min-h-[100px] px-1 transition-colors rounded-md ${snapshot.isDraggingOver ? "bg-secondary/50" : ""}`}
            >
              {column.tasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} onDeleteTask={onDeleteTask} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <div className="mt-2 px-1">
          {isAddingTask ? (
            <form onSubmit={handleAddTask} className="bg-background p-2 rounded-md shadow-sm border">
              <Input
                autoFocus
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="mb-2 h-8 text-sm"
              />
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => setIsAddingTask(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground h-9"
              onClick={() => setIsAddingTask(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the column "{column.title}" and all its tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
