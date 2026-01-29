import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Task } from "@/types"
import { Draggable } from "@hello-pangea/dnd"
import { useState } from "react"
import TaskDetailModal from "./TaskDetailModal"
import { Clock } from "lucide-react"
import { format, isPast } from "date-fns"

interface TaskCardProps {
  task: Task
  index: number
  onDeleteTask?: (taskId: string) => void
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'low':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export default function TaskCard({ task, index, onDeleteTask }: TaskCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const isOverdue = task.due_date ? isPast(new Date(task.due_date)) && !isPast(new Date(new Date(task.due_date).setHours(23, 59, 59))) : false

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="mb-2"
            style={{ ...provided.draggableProps.style }}
            onClick={() => setIsModalOpen(true)}
          >
            <Card className={`cursor-pointer transition-shadow hover:shadow-md ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 rotate-2" : ""}`}>
              <CardContent className="p-3">
                <p className="text-sm font-medium">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                )}
                
                {/* Metadata Display */}
                <div className="flex items-center gap-2 mt-2">
                  {/* Priority Badge */}
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                  
                  {/* Due Date */}
                  {task.due_date && (
                    <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(task.due_date), "MMM d")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
      
      {isModalOpen && (
        <TaskDetailModal 
          taskId={task.id} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onDeleteTask={onDeleteTask}
        />
      )}
    </>
  )
}
