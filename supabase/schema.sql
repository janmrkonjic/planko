-- PROFILES
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  email text,
  username text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- BOARDS
create table public.boards (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.boards enable row level security;

create policy "Users can view their own boards"
  on public.boards for select
  using ( auth.uid() = owner_id );

create policy "Users can create their own boards"
  on public.boards for insert
  with check ( auth.uid() = owner_id );

create policy "Users can update their own boards"
  on public.boards for update
  using ( auth.uid() = owner_id );

create policy "Users can delete their own boards"
  on public.boards for delete
  using ( auth.uid() = owner_id );

-- COLUMNS
create table public.columns (
  id uuid not null default gen_random_uuid() primary key,
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  order_index integer not null,
  created_at timestamptz default now()
);

alter table public.columns enable row level security;

create policy "Users can view columns of their boards"
  on public.columns for select
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Users can insert columns to their boards"
  on public.columns for insert
  with check (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Users can update columns of their boards"
  on public.columns for update
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Users can delete columns of their boards"
  on public.columns for delete
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
      and boards.owner_id = auth.uid()
    )
  );

-- TASKS
create table public.tasks (
  id uuid not null default gen_random_uuid() primary key,
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users can view tasks of their boards"
  on public.tasks for select
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = tasks.column_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Users can insert tasks to their boards"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = tasks.column_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Users can update tasks of their boards"
  on public.tasks for update
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = tasks.column_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Users can delete tasks of their boards"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = tasks.column_id
      and boards.owner_id = auth.uid()
    )
  );

-- SUBTASKS
create table public.subtasks (
  id uuid not null default gen_random_uuid() primary key,
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_completed boolean default false,
  created_at timestamptz default now()
);

alter table public.subtasks enable row level security;

create policy "Users can view subtasks of their boards"
  on public.subtasks for select
  using (
    exists (
      select 1 from public.tasks
      join public.columns on columns.id = tasks.column_id
      join public.boards on boards.id = columns.board_id
      where tasks.id = subtasks.task_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Users can insert subtasks to their boards"
  on public.subtasks for insert
  with check (
    exists (
      select 1 from public.tasks
      join public.columns on columns.id = tasks.column_id
      join public.boards on boards.id = columns.board_id
      where tasks.id = subtasks.task_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Users can update subtasks of their boards"
  on public.subtasks for update
  using (
    exists (
      select 1 from public.tasks
      join public.columns on columns.id = tasks.column_id
      join public.boards on boards.id = columns.board_id
      where tasks.id = subtasks.task_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Users can delete subtasks of their boards"
  on public.subtasks for delete
  using (
    exists (
      select 1 from public.tasks
      join public.columns on columns.id = tasks.column_id
      join public.boards on boards.id = columns.board_id
      where tasks.id = subtasks.task_id
      and boards.owner_id = auth.uid()
    )
  );

-- TRIGGER for new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
