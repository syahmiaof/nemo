-- Nemo Sprint 5.1 Hardening: Authorization & Owner UID Pinning
-- Database: PostgreSQL / Supabase
-- Target Project: nemo (ap-southeast-2)

ALTER TABLE public.app_owners 
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.is_approved_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
  is_confirmed BOOLEAN;
  user_email TEXT;
  approved_owner_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. If owner_user_id is already pinned, verify exact UID match
  SELECT owner_user_id INTO approved_owner_id
  FROM public.app_owners
  WHERE is_approved = TRUE AND owner_user_id IS NOT NULL
  LIMIT 1;

  IF approved_owner_id IS NOT NULL THEN
    RETURN (current_user_id = approved_owner_id);
  END IF;

  -- 2. First-time pin: strictly require confirmed email
  SELECT (email_confirmed_at IS NOT NULL), lower(email)
  INTO is_confirmed, user_email
  FROM auth.users
  WHERE id = current_user_id;

  IF is_confirmed IS TRUE AND user_email IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.app_owners
      WHERE lower(email) = user_email AND is_approved = TRUE
    ) THEN
      UPDATE public.app_owners
      SET owner_user_id = current_user_id
      WHERE lower(email) = user_email;

      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.is_approved_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved_owner() TO authenticated;
