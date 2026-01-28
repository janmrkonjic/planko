export interface Board {
  id: string
  title: string
  owner_id: string
  created_at: string
}

export interface Column {
  id: string
  board_id: string
  title: string
  order_index: number
  created_at: string
}

export interface Task {
  id: string
  column_id: string
  title: string
  description?: string
  order_index: number
  created_at: string
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  order_index: number
  created_at: string
}

export interface BoardDetails extends Board {
  columns: (Column & { tasks: Task[] })[]
}
