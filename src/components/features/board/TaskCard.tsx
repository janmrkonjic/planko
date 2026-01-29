import { Card, CardContent } from "@/components/ui/card"
import { Task } from "@/types"
import { Draggable } from "@hello-pangea/dnd"
import { useState } from "react"
import TaskDetailModal from "./TaskDetailModal"

interface TaskCardProps {
  task: Task
  index: number
  onDeleteTask?: (taskId: string) => void
}

export default function TaskCard({ task, index, onDeleteTask }: TaskCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

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
