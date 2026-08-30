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
    'tools_equipment',
    'transport',
    'gas',
    'meal',
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
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner')),
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
    'owner'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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

-- 3. Harvests (must exist before income FK)
CREATE TABLE IF NOT EXISTS harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  kg_harvested NUMERIC(10,2) NOT NULL CHECK (kg_harvested > 0),
  num_red_bags NUMERIC(10,2) DEFAULT 0,
  loose_kg NUMERIC(10,2) DEFAULT 0,
  num_harvesters INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm team can view all harvests" ON harvests;
CREATE POLICY "Farm team can view all harvests"
  ON harvests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Farm team can insert harvests" ON harvests;
CREATE POLICY "Farm team can insert harvests"
  ON harvests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Farm team can update all harvests" ON harvests;
DROP POLICY IF EXISTS "Farm team can delete all harvests" ON harvests;
DROP POLICY IF EXISTS "Users can update own harvests" ON harvests;
CREATE POLICY "Users can update own harvests"
  ON harvests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own harvests" ON harvests;
CREATE POLICY "Users can delete own harvests"
  ON harvests FOR DELETE TO authenticated USING (auth.uid() = user_id);

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
  loose_kg_sold NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE
      WHEN COALESCE(num_red_bags, 0) > 0 AND COALESCE(price_per_red_bag, 0) > 0
           AND COALESCE(loose_kg_sold, 0) > 0 AND COALESCE(price_per_kg, 0) > 0
        THEN (num_red_bags * price_per_red_bag) + (loose_kg_sold * price_per_kg)
      WHEN COALESCE(num_red_bags, 0) > 0 AND COALESCE(price_per_red_bag, 0) > 0
        THEN (num_red_bags * price_per_red_bag)
      ELSE (kg_sold * price_per_kg)
    END
  ) STORED,
  harvest_id UUID REFERENCES harvests(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm team can view all income" ON income;
CREATE POLICY "Farm team can view all income"
  ON income FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Farm team can insert income" ON income;
CREATE POLICY "Farm team can insert income"
  ON income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Farm team can update all income" ON income;
DROP POLICY IF EXISTS "Farm team can delete all income" ON income;
DROP POLICY IF EXISTS "Users can update own income" ON income;
CREATE POLICY "Users can update own income"
  ON income FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own income" ON income;
CREATE POLICY "Users can delete own income"
  ON income FOR DELETE TO authenticated USING (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "Farm team can view all expenses" ON expenses;
CREATE POLICY "Farm team can view all expenses"
  ON expenses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Farm team can insert expenses" ON expenses;
CREATE POLICY "Farm team can insert expenses"
  ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Farm team can update all expenses" ON expenses;
DROP POLICY IF EXISTS "Farm team can delete all expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_income_harvest_id ON income(harvest_id);
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_harvests_user_date ON harvests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(user_id, category);

-- 7. Receipts storage bucket (private — use signed URLs in the app)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Farm team can view all receipts" ON storage.objects;
CREATE POLICY "Farm team can view all receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 8. Prevent overselling harvest batches
CREATE OR REPLACE FUNCTION public.check_harvest_sale_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  harvest_kg NUMERIC;
  sold_kg NUMERIC;
BEGIN
  IF NEW.harvest_id IS NULL OR COALESCE(NEW.kg_sold, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(h.kg_harvested, 0)
  INTO harvest_kg
  FROM harvests h
  WHERE h.id = NEW.harvest_id;

  IF harvest_kg IS NULL THEN
    RAISE EXCEPTION 'Harvest batch not found';
  END IF;

  SELECT COALESCE(SUM(i.kg_sold), 0)
  INTO sold_kg
  FROM income i
  WHERE i.harvest_id = NEW.harvest_id
    AND i.id IS DISTINCT FROM NEW.id;

  IF sold_kg + NEW.kg_sold > harvest_kg + 0.001 THEN
    RAISE EXCEPTION 'This sale exceeds remaining harvest inventory (%.1f kg available)', GREATEST(harvest_kg - sold_kg, 0);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_harvest_sale_inventory ON income;
CREATE TRIGGER check_harvest_sale_inventory
  BEFORE INSERT OR UPDATE OF harvest_id, kg_sold ON income
  FOR EACH ROW
  EXECUTE FUNCTION public.check_harvest_sale_inventory();

-- Promote farm owner (only needed if upgrading from staff role):
-- UPDATE profiles SET role = 'owner' WHERE email = 'your-email@farm.ph';
