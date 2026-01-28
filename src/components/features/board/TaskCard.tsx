import { Card, CardContent } from "@/components/ui/card"
import { Task } from "@/types"

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className="mb-2 cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <p className="text-sm font-medium">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
        )}
      </CardContent>
    </Card>
  )
}
