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

export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  column_id: string
  title: string
  description?: string
  priority: Priority
  due_date: string | null
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

export interface Profile {
  id: string
  user_id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
}
