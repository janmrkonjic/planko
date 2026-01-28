import { useState } from "react"
import { Column as ColumnType, Task } from "@/types"
import TaskCard from "./TaskCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"

interface ColumnProps {
  column: ColumnType & { tasks: Task[] }
  onAddTask: (columnId: string, title: string) => void
}

export default function Column({ column, onAddTask }: ColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    onAddTask(column.id, newTaskTitle)
    setNewTaskTitle("")
    setIsAddingTask(false)
  }

  return (
    <div className="w-80 flex-shrink-0 flex flex-col max-h-full bg-secondary/30 rounded-lg p-2 mr-4">
      <div className="flex items-center justify-between p-2 mb-2">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="text-xs text-muted-foreground">{column.tasks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-1">
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

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
  )
}
