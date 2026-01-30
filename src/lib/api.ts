import { supabase } from './supabase'
import type { Board } from '../types'

export async function getBoards() {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as Board[]
}

export async function createBoard(title: string) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('boards')
    .insert([
      { title, owner_id: user.id }
    ])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Board
}

export async function deleteBoard(boardId: string) {
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateBoard(boardId: string, updates: Partial<Board>) {
  const { data, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', boardId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Board
}
