-- Final fix for RLS recursion using security definer function
-- This completely eliminates the circular dependency

-- ============================================================================
-- HELPER FUNCTION (bypasses RLS to check membership)
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.is_board_member(uuid, uuid);

-- Create a security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_board_member(board_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_members.board_id = $1
    AND board_members.user_id = $2
  );
$$;

-- ============================================================================
-- BOARDS POLICIES (using helper function - no recursion)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their boards" ON public.boards;
DROP POLICY IF EXISTS "Users can view boards they own or are members of" ON public.boards;
DROP POLICY IF EXISTS "Users can create boards" ON public.boards;
DROP POLICY IF EXISTS "Users can create their own boards" ON public.boards;
DROP POLICY IF EXISTS "Owners can update boards" ON public.boards;
DROP POLICY IF EXISTS "Board owners can update their boards" ON public.boards;
DROP POLICY IF EXISTS "Owners can delete boards" ON public.boards;
DROP POLICY IF EXISTS "Board owners can delete their boards" ON public.boards;

CREATE POLICY "Users can view boards"
  ON public.boards FOR SELECT
  USING (
    auth.uid() = owner_id 
    OR public.is_board_member(id, auth.uid())
  );

CREATE POLICY "Users can create boards"
  ON public.boards FOR INSERT
  WITH CHECK ( auth.uid() = owner_id );

CREATE POLICY "Owners can update boards"
  ON public.boards FOR UPDATE
  USING ( auth.uid() = owner_id );

CREATE POLICY "Owners can delete boards"
  ON public.boards FOR DELETE
  USING ( auth.uid() = owner_id );

-- ============================================================================
-- BOARD_MEMBERS POLICIES (simple - no recursion)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view board members" ON public.board_members;
DROP POLICY IF EXISTS "Users can view members of boards they own or are members of" ON public.board_members;
DROP POLICY IF EXISTS "Owners can add members" ON public.board_members;
DROP POLICY IF EXISTS "Board owners can add members" ON public.board_members;
DROP POLICY IF EXISTS "Owners can remove members" ON public.board_members;
DROP POLICY IF EXISTS "Board owners can remove members" ON public.board_members;

CREATE POLICY "Users can view board members"
  ON public.board_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_members.board_id
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can add members"
  ON public.board_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_members.board_id
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can remove members"
  ON public.board_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_members.board_id
      AND boards.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- COLUMNS POLICIES (using helper function)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view columns" ON public.columns;
DROP POLICY IF EXISTS "Users can view columns of boards they have access to" ON public.columns;
DROP POLICY IF EXISTS "Users can insert columns" ON public.columns;
DROP POLICY IF EXISTS "Users can insert columns to boards they have access to" ON public.columns;
DROP POLICY IF EXISTS "Users can update columns" ON public.columns;
DROP POLICY IF EXISTS "Users can update columns of boards they have access to" ON public.columns;
DROP POLICY IF EXISTS "Users can delete columns" ON public.columns;
DROP POLICY IF EXISTS "Users can delete columns of boards they have access to" ON public.columns;

CREATE POLICY "Users can view columns"
  ON public.columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

CREATE POLICY "Users can insert columns"
  ON public.columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

CREATE POLICY "Users can update columns"
  ON public.columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

CREATE POLICY "Users can delete columns"
  ON public.columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = columns.board_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

-- ============================================================================
-- TASKS POLICIES (using helper function)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks of boards they have access to" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks to boards they have access to" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks of boards they have access to" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks of boards they have access to" ON public.tasks;

CREATE POLICY "Users can view tasks"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

CREATE POLICY "Users can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

CREATE POLICY "Users can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

CREATE POLICY "Users can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.columns
      JOIN public.boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

-- ============================================================================
-- SUBTASKS POLICIES (using helper function)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users can view subtasks of boards they have access to" ON public.subtasks;
DROP POLICY IF EXISTS "Users can insert subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users can insert subtasks to boards they have access to" ON public.subtasks;
DROP POLICY IF EXISTS "Users can update subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users can update subtasks of boards they have access to" ON public.subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks of boards they have access to" ON public.subtasks;

CREATE POLICY "Users can view subtasks"
  ON public.subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = subtasks.task_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

CREATE POLICY "Users can insert subtasks"
  ON public.subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = subtasks.task_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

CREATE POLICY "Users can update subtasks"
  ON public.subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = subtasks.task_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );

CREATE POLICY "Users can delete subtasks"
  ON public.subtasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.columns ON columns.id = tasks.column_id
      JOIN public.boards ON boards.id = columns.board_id
      WHERE tasks.id = subtasks.task_id
      AND (boards.owner_id = auth.uid() OR public.is_board_member(boards.id, auth.uid()))
    )
  );
