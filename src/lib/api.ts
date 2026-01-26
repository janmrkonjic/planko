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
  // We don't need to pass owner_id explicitly because RLS policies 
  // and the table default could handle it if set up that way,
  // but usually for 'insert' with RLS checking 'auth.uid() = owner_id',
  // we SHOULD pass owner_id OR have a default value that equals auth.uid().
  // However, Supabase RLS 'with check' ensures the payload matches.
  // The common pattern is to just send the data.
  // Let's grab the current user to be safe and explicit, 
  // or rely on a postgres trigger/default if it existed.
  // The schema doesn't have a default for owner_id based on auth.uid(), 
  // so we must send it.
  
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
