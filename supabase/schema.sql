-- ============================================================
-- J&G Farm Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Expense category enum
CREATE TYPE expense_category AS ENUM (
  'fertilizer',
  'pesticides',
  'labor',
  'irrigation',
  'tools_equipment',
  'transport',
  'land_rent',
  'other'
);

-- 2. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Income table
CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  buyer TEXT NOT NULL DEFAULT '',
  kg_sold NUMERIC(10,2) NOT NULL CHECK (kg_sold > 0),
  price_per_kg NUMERIC(10,2) NOT NULL CHECK (price_per_kg > 0),
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (kg_sold * price_per_kg) STORED,
  harvest_id UUID REFERENCES harvests(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own income"
  ON income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income"
  ON income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income"
  ON income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income"
  ON income FOR DELETE USING (auth.uid() = user_id);

-- 4. Harvests table (created before income for FK reference)
CREATE TABLE harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  block_name TEXT NOT NULL DEFAULT '',
  kg_harvested NUMERIC(10,2) NOT NULL CHECK (kg_harvested > 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own harvests"
  ON harvests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own harvests"
  ON harvests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own harvests"
  ON harvests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own harvests"
  ON harvests FOR DELETE USING (auth.uid() = user_id);

-- 5. Expenses table
CREATE TABLE expenses (
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

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE USING (auth.uid() = user_id);

-- 6. Indexes for common queries
CREATE INDEX idx_income_user_date ON income(user_id, date DESC);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_harvests_user_date ON harvests(user_id, date DESC);
CREATE INDEX idx_expenses_category ON expenses(user_id, category);

-- 7. Storage bucket for receipts
-- NOTE: Create the 'receipts' bucket manually in Supabase Dashboard > Storage
-- Then add this policy in SQL:
-- CREATE POLICY "Users can upload receipts"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view own receipts"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own receipts"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
