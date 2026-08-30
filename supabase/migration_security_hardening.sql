-- Migration: Security hardening & shared farm data
-- Run in Supabase Dashboard → SQL Editor → New query → Run

-- 1. Always create new users as owner
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

-- 2. Prevent users from changing their own role via the API
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF current_user IN ('postgres', 'supabase_admin') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Role changes must be done by an administrator in Supabase';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_change ON profiles;
CREATE TRIGGER prevent_profile_role_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();

-- Promote a user to owner (run manually, replace email):
-- UPDATE profiles SET role = 'owner' WHERE email = 'owner@farm.ph';

-- 3. Shared farm data — all authenticated team members see the same records
DROP POLICY IF EXISTS "Users can view own harvests" ON harvests;
DROP POLICY IF EXISTS "Users can insert own harvests" ON harvests;
DROP POLICY IF EXISTS "Users can update own harvests" ON harvests;
DROP POLICY IF EXISTS "Users can delete own harvests" ON harvests;

CREATE POLICY "Farm team can view all harvests"
  ON harvests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Farm team can insert harvests"
  ON harvests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farm team can update all harvests"
  ON harvests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Farm team can delete all harvests"
  ON harvests FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view own income" ON income;
DROP POLICY IF EXISTS "Users can insert own income" ON income;
DROP POLICY IF EXISTS "Users can update own income" ON income;
DROP POLICY IF EXISTS "Users can delete own income" ON income;

CREATE POLICY "Farm team can view all income"
  ON income FOR SELECT TO authenticated USING (true);
CREATE POLICY "Farm team can insert income"
  ON income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farm team can update all income"
  ON income FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Farm team can delete all income"
  ON income FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

CREATE POLICY "Farm team can view all expenses"
  ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Farm team can insert expenses"
  ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farm team can update all expenses"
  ON expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Farm team can delete all expenses"
  ON expenses FOR DELETE TO authenticated USING (true);

-- 4. Private receipts bucket — authenticated access only
UPDATE storage.buckets
SET public = false
WHERE id = 'receipts';

DROP POLICY IF EXISTS "Public can read receipts" ON storage.objects;

DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
CREATE POLICY "Farm team can view all receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts');

-- Upload/delete still scoped to the uploader's folder for safety
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
