-- Migration: Add Board Collaboration Features
-- This migration adds support for board members, invitations, and task assignments

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- Board Members: Links users to boards they're members of
CREATE TABLE IF NOT EXISTS public.board_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Board Invites: Stores pending board invitations
CREATE TABLE IF NOT EXISTS public.board_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.board_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE ALTERATIONS
-- ============================================================================

-- Rename assigned_to to assignee_id for consistency (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.tasks RENAME COLUMN assigned_to TO assignee_id;
  END IF;
END $$;

-- Add assignee_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'assignee_id'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add priority and due_date columns if they don't exist (from types)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN due_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add full_name to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
END $$;

-- Add order_index to subtasks if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subtasks' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE public.subtasks ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- POPULATE BOARD_MEMBERS WITH EXISTING OWNERS
-- ============================================================================

-- Add all existing board owners as members with 'owner' role
INSERT INTO public.board_members (board_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.boards
ON CONFLICT (board_id, user_id) DO NOTHING;

-- ============================================================================
-- DROP OLD RLS POLICIES
-- ============================================================================

-- Boards
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can create their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON public.boards;

-- Columns
DROP POLICY IF EXISTS "Users can view columns of their boards" ON public.columns;
DROP POLICY IF EXISTS "Users can insert columns to their boards" ON public.columns;
DROP POLICY IF EXISTS "Users can update columns of their boards" ON public.columns;
DROP POLICY IF EXISTS "Users can delete columns of their boards" ON public.columns;

-- Tasks
DROP POLICY IF EXISTS "Users can view tasks of their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks to their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks of their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks of their boards" ON public.tasks;

-- Subtasks
DROP POLICY IF EXISTS "Users can view subtasks of their boards" ON public.subtasks;
DROP POLICY IF EXISTS "Users can insert subtasks to their boards" ON public.subtasks;
DROP POLICY IF EXISTS "Users can update subtasks of their boards" ON public.subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks of their boards" ON public.subtasks;

-- ============================================================================
-- NEW RLS POLICIES (WITH MEMBER ACCESS)
-- ============================================================================

-- BOARDS: Owners and members can access
CREATE POLICY "Users can view boards they own or are members of"
  ON public.boards FOR SELECT
  USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM public.board_members
      WHERE board_members.board_id = boards.id
      AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own boards"
  ON public.boards FOR INSERT
  WITH CHECK ( auth.uid() = owner_id );

CREATE POLICY "Board owners can update their boards"
  ON public.boards FOR UPDATE
  USING ( auth.uid() = owner_id );

CREATE POLICY "Board owners can delete their boards"
  ON public.boards FOR DELETE
  USING ( auth.uid() = owner_id );

-- COLUMNS: Owners and members can access
CREATE POLICY "Users can view columns of boards they have access to"
  ON public.columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert columns to boards they have access to"
  ON public.columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update columns of boards they have access to"
  ON public.columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete columns of boards they have access to"
  ON public.columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

-- TASKS: Owners and members can access
CREATE POLICY "Users can view tasks of boards they have access to"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert tasks to boards they have access to"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update tasks of boards they have access to"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete tasks of boards they have access to"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

-- SUBTASKS: Owners and members can access
CREATE POLICY "Users can view subtasks of boards they have access to"
  ON public.subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = subtasks.task_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert subtasks to boards they have access to"
  ON public.subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = subtasks.task_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update subtasks of boards they have access to"
  ON public.subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = subtasks.task_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete subtasks of boards they have access to"
  ON public.subtasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = subtasks.task_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- BOARD_MEMBERS RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view members of boards they have access to"
  ON public.board_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_members.board_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_members bm
          WHERE bm.board_id = boards.id
          AND bm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Board owners can add members"
  ON public.board_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_members.board_id
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Board owners can remove members"
  ON public.board_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_members.board_id
      AND boards.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- BOARD_INVITES RLS POLICIES
-- ============================================================================

CREATE POLICY "Board owners can view invites for their boards"
  ON public.board_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_invites.board_id
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Board owners can create invites"
  ON public.board_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_invites.board_id
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view invites by token"
  ON public.board_invites FOR SELECT
  USING ( true );

CREATE POLICY "Anyone can delete invites by token (for joining)"
  ON public.board_invites FOR DELETE
  USING ( true );
