import { Card, CardContent } from "@/components/ui/card"
import { Task } from "@/types"
import { Draggable } from "@hello-pangea/dnd"

interface TaskCardProps {
  task: Task
  index: number
}

export default function TaskCard({ task, index }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2"
          style={{ ...provided.draggableProps.style }}
        >
          <Card className={`cursor-pointer transition-shadow hover:shadow-md ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 rotate-2" : ""}`}>
            <CardContent className="p-3">
              <p className="text-sm font-medium">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
