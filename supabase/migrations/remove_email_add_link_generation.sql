-- Migration: Remove email column from board_invites and add RPC function
-- This migration removes email-based invites and adds link generation function

-- ============================================================================
-- REMOVE EMAIL COLUMN FROM BOARD_INVITES
-- ============================================================================

-- Drop the email column from board_invites table
ALTER TABLE public.board_invites DROP COLUMN IF EXISTS email;

-- ============================================================================
-- CREATE RPC FUNCTION FOR GENERATING INVITE LINKS
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.generate_invite_link(uuid);

-- Create function to generate invite link (board owners only)
CREATE OR REPLACE FUNCTION public.generate_invite_link(p_board_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token uuid;
BEGIN
  -- Verify the caller is the board owner
  IF NOT EXISTS (
    SELECT 1 FROM public.boards
    WHERE id = p_board_id
    AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only board owners can generate invite links';
  END IF;

  -- Insert new invite and return the token
  INSERT INTO public.board_invites (board_id)
  VALUES (p_board_id)
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_invite_link(uuid) TO authenticated;

-- ============================================================================
-- UPDATE RLS POLICIES FOR BOARD_INVITES (if needed)
-- ============================================================================

-- The existing policies should already allow:
-- 1. Board owners to create invites
-- 2. Anyone to view invites by token (for joining)
-- 3. Anyone to delete invites by token (for cleanup after joining)

-- Verify policies exist
DO $$
BEGIN
  -- Check if the "Anyone can view invites by token" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'board_invites' 
    AND policyname = 'Anyone can view invites by token'
  ) THEN
    CREATE POLICY "Anyone can view invites by token"
      ON public.board_invites FOR SELECT
      USING ( true );
  END IF;

  -- Check if the "Anyone can delete invites by token (for joining)" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'board_invites' 
    AND policyname = 'Anyone can delete invites by token (for joining)'
  ) THEN
    CREATE POLICY "Anyone can delete invites by token (for joining)"
      ON public.board_invites FOR DELETE
      USING ( true );
  END IF;
END $$;
