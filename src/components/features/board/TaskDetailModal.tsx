import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTaskDetails } from "@/hooks/useTaskDetails"
import { X, Wand2 } from "lucide-react"
import { useState } from "react"
import { useAiBreakdown } from "@/hooks/useAiBreakdown"

interface TaskDetailModalProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
}

export default function TaskDetailModal({ taskId, isOpen, onClose }: TaskDetailModalProps) {
  const { 
    task, 
    subtasks, 
    isLoading, 
    updateTask, 
    addSubtask, 
    toggleSubtask, 
    deleteSubtask 
  } = useTaskDetails(taskId)

  const { generateSubtasks, isGenerating } = useAiBreakdown()

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

  const handleDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (task && e.target.value !== task.description) {
      updateTask({ description: e.target.value })
    }
  }

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    addSubtask(newSubtaskTitle)
    setNewSubtaskTitle("")
  }

  const handleAiBreakdown = async () => {
    if (!task) return
    await generateSubtasks({ 
      taskId: task.id, 
      taskTitle: task.title, 
      taskDescription: task.description 
    })
  }

  if (isLoading && !task) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold">{task?.title}</DialogTitle>
          <DialogDescription className="sr-only">Task details</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {/* Description Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Description</h3>
            <Textarea
              defaultValue={task?.description || ""}
              onBlur={handleDescriptionBlur}
              placeholder="Add a more detailed description..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Subtasks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Subtasks</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className={`h-7 text-xs border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-800 ${isGenerating ? "animate-pulse" : ""}`}
                onClick={handleAiBreakdown}
                disabled={isGenerating}
              >
                <Wand2 className={`w-3 h-3 mr-1.5 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "Thinking..." : "Break down with AI"}
              </Button>
            </div>

            <div className="space-y-2 mb-4">
              {subtasks?.map((subtask) => (
                <div key={subtask.id} className="flex items-start gap-2 group">
                  <Checkbox 
                    checked={subtask.is_completed} 
                    onCheckedChange={(checked) => toggleSubtask({ id: subtask.id, isCompleted: !!checked })}
                    className="mt-1"
                  />
                  <span className={`flex-1 text-sm ${subtask.is_completed ? "text-muted-foreground line-through" : ""}`}>
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteSubtask(subtask.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a subtask..."
                className="h-8 text-sm"
              />
              <Button type="submit" size="sm" className="h-8">Add</Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
