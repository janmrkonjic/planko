-- Add potentially missing columns to the existing subtasks table
alter table public.subtasks add column if not exists title text;
alter table public.subtasks add column if not exists is_completed boolean default false;
alter table public.subtasks add column if not exists order_index integer default 0;
alter table public.subtasks add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Ensure RLS is enabled
alter table public.subtasks enable row level security;

-- Drop existing policies to avoid conflicts when recreating them
drop policy if exists "Enable read access for all users" on public.subtasks;
drop policy if exists "Enable insert for all users" on public.subtasks;
drop policy if exists "Enable update for all users" on public.subtasks;
drop policy if exists "Enable delete for all users" on public.subtasks;

-- Re-create policies
create policy "Enable read access for all users"
on public.subtasks for select
using (true);

create policy "Enable insert for all users"
on public.subtasks for insert
with check (true);

create policy "Enable update for all users"
on public.subtasks for update
using (true);

create policy "Enable delete for all users"
on public.subtasks for delete
using (true);
