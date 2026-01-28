
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSubtasks() {
  console.log("Checking subtasks table...")
  
  // Try to select from subtasks
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .limit(1)

  if (error) {
    console.error("Error accessing subtasks table:", error)
  } else {
    console.log("Subtasks table accessed successfully. Data:", data)
  }
}

checkSubtasks()
