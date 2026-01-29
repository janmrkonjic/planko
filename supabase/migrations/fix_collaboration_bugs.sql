-- Migration: Fix collaboration bugs with secure join function
-- This migration adds a secure RPC function for joining boards via token

-- ============================================================================
-- CREATE SECURE JOIN FUNCTION
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.join_board_via_token(uuid);

-- Create secure function to join board via invite token
CREATE OR REPLACE FUNCTION public.join_board_via_token(invite_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_board_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Look up the invite token and get board_id
  SELECT board_id INTO v_board_id
  FROM public.board_invites
  WHERE token = invite_token;

  IF v_board_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = v_board_id
    AND user_id = v_user_id
  ) THEN
    -- Already a member, just return the board_id
    RETURN v_board_id;
  END IF;

  -- Insert user as a member (SECURITY DEFINER bypasses RLS)
  INSERT INTO public.board_members (board_id, user_id, role)
  VALUES (v_board_id, v_user_id, 'member');

  -- Optionally delete the invite token after use (single-use tokens)
  -- DELETE FROM public.board_invites WHERE token = invite_token;

  -- Return the board_id for redirect
  RETURN v_board_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.join_board_via_token(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.join_board_via_token(uuid) IS 
'Securely joins a user to a board using an invite token. Bypasses RLS to allow self-insertion into board_members.';
