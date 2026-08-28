-- ============================================================
-- J&G Farm Tracker — Supabase Schema
-- Run this once in: Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Expense category enum
DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'fertilizer',
    'pesticides',
    'labor',
    'irrigation',
    'tools_equipment',
    'transport',
    'gas',
    'meal',
    'land_rent',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

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
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Harvests (must exist before income FK)
CREATE TABLE IF NOT EXISTS harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  block_name TEXT NOT NULL DEFAULT '',
  kg_harvested NUMERIC(10,2) NOT NULL CHECK (kg_harvested > 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own harvests" ON harvests;
CREATE POLICY "Users can view own harvests"
  ON harvests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own harvests" ON harvests;
CREATE POLICY "Users can insert own harvests"
  ON harvests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own harvests" ON harvests;
CREATE POLICY "Users can update own harvests"
  ON harvests FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own harvests" ON harvests;
CREATE POLICY "Users can delete own harvests"
  ON harvests FOR DELETE USING (auth.uid() = user_id);

-- 4. Income
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  buyer TEXT NOT NULL DEFAULT '',
  kg_sold NUMERIC(10,2) DEFAULT 0,
  price_per_kg NUMERIC(10,2) DEFAULT 0,
  num_red_bags NUMERIC(10,2) DEFAULT 0,
  price_per_red_bag NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE 
      WHEN (kg_sold * price_per_kg) > 0 THEN (kg_sold * price_per_kg)
      ELSE (num_red_bags * price_per_red_bag)
    END
  ) STORED,
  harvest_id UUID REFERENCES harvests(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own income" ON income;
CREATE POLICY "Users can view own income"
  ON income FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own income" ON income;
CREATE POLICY "Users can insert own income"
  ON income FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own income" ON income;
CREATE POLICY "Users can update own income"
  ON income FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own income" ON income;
CREATE POLICY "Users can delete own income"
  ON income FOR DELETE USING (auth.uid() = user_id);

-- 5. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category expense_category NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  receipt_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE USING (auth.uid() = user_id);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_harvests_user_date ON harvests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(user_id, category);

-- 7. Receipts storage bucket (public so getPublicUrl works)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Public can read receipts" ON storage.objects;
CREATE POLICY "Public can read receipts"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
