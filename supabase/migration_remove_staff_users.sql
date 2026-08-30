-- Migration: Remove staff users and promote remaining accounts to owner
-- Run in Supabase Dashboard → SQL Editor
-- Reassigns staff-created records to the primary owner, then deletes staff auth accounts.

DO $$
DECLARE
  owner_id UUID;
  staff_ids UUID[];
BEGIN
  SELECT id INTO owner_id
  FROM profiles
  WHERE role = 'owner'
  ORDER BY created_at
  LIMIT 1;

  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No owner account found. Promote an account first: UPDATE profiles SET role = ''owner'' WHERE email = ''your@email.com'';';
  END IF;

  SELECT array_agg(id) INTO staff_ids FROM profiles WHERE role = 'staff';

  IF staff_ids IS NOT NULL THEN
    UPDATE harvests SET user_id = owner_id WHERE user_id = ANY(staff_ids);
    UPDATE income SET user_id = owner_id WHERE user_id = ANY(staff_ids);
    UPDATE expenses SET user_id = owner_id WHERE user_id = ANY(staff_ids);

    DELETE FROM auth.users WHERE id = ANY(staff_ids);
  END IF;
END $$;

-- New signups are owners (staff role removed from app)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'owner'
  );
  RETURN NEW;
END;
$$;

-- Promote any leftover staff profiles (if auth user was deleted manually)
UPDATE profiles SET role = 'owner' WHERE role = 'staff';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner'));
