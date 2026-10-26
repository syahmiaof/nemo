-- Supabase Migration: Fix admin_add_workspace_member generated column issue
-- Version: 20261026_fix_admin_add_workspace_member_generated_email
-- Fixes PostgreSQL error 428C9: cannot insert a non-DEFAULT value into column "email" in auth.identities
-- because auth.identities.email is ALWAYS GENERATED as lower((identity_data ->> 'email'::text))

CREATE OR REPLACE FUNCTION public.admin_add_workspace_member(
  p_email text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_caller_email text;
  v_clean_email text;
  v_user_id uuid;
  v_hashed_password text;
BEGIN
  v_caller_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  
  -- Only primary owner can invoke this function
  IF v_caller_email <> 'syahmiaof123@gmail.com' AND auth.uid() <> 'cc098985-3ed8-4582-b574-2b586b66e6f5'::uuid THEN
    RAISE EXCEPTION 'Access denied: Only syahmiaof123@gmail.com can manage workspace members.';
  END IF;

  v_clean_email := lower(trim(p_email));
  IF v_clean_email = '' OR v_clean_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'Invalid email address.';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters.';
  END IF;

  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Check if user exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_clean_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      role,
      aud,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_clean_email,
      v_hashed_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('sub', v_user_id, 'email', v_clean_email, 'email_verified', true),
      now(),
      now()
    );

    -- Insert into auth.identities (omit 'email' column as it is ALWAYS GENERATED)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id, 'email', v_clean_email, 'email_verified', true, 'phone_verified', false),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Update existing user password
    UPDATE auth.users
    SET
      encrypted_password = v_hashed_password,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Ensure in app_owners
  INSERT INTO public.app_owners (email, is_approved, owner_user_id)
  VALUES (v_clean_email, true, v_user_id)
  ON CONFLICT (email)
  DO UPDATE SET is_approved = true, owner_user_id = v_user_id;

  -- Ensure profile row exists
  INSERT INTO public.profiles (id, email, display_name, updated_at)
  VALUES (v_user_id, v_clean_email, split_part(v_clean_email, '@', 1), now())
  ON CONFLICT (id)
  DO UPDATE SET email = v_clean_email, updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'email', v_clean_email,
    'user_id', v_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_add_workspace_member(text, text) TO authenticated;
