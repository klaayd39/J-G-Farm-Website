-- Super Napier Silage module tables
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS silage_harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  num_bags NUMERIC(10,2) NOT NULL DEFAULT 0,
  num_cuttings NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT silage_harvest_has_units CHECK (num_bags > 0 OR num_cuttings > 0)
);

ALTER TABLE silage_harvests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm team can view all silage harvests" ON silage_harvests;
CREATE POLICY "Farm team can view all silage harvests"
  ON silage_harvests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Farm team can insert silage harvests" ON silage_harvests;
CREATE POLICY "Farm team can insert silage harvests"
  ON silage_harvests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own silage harvests" ON silage_harvests;
CREATE POLICY "Users can update own silage harvests"
  ON silage_harvests FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own silage harvests" ON silage_harvests;
CREATE POLICY "Users can delete own silage harvests"
  ON silage_harvests FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS silage_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  buyer TEXT NOT NULL DEFAULT '',
  num_bags NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_per_bag NUMERIC(10,2) NOT NULL DEFAULT 0,
  num_cuttings NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_per_cutting NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (
    (COALESCE(num_bags, 0) * COALESCE(price_per_bag, 0))
    + (COALESCE(num_cuttings, 0) * COALESCE(price_per_cutting, 0))
  ) STORED,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT silage_income_has_units CHECK (num_bags > 0 OR num_cuttings > 0)
);

ALTER TABLE silage_income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm team can view all silage income" ON silage_income;
CREATE POLICY "Farm team can view all silage income"
  ON silage_income FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Farm team can insert silage income" ON silage_income;
CREATE POLICY "Farm team can insert silage income"
  ON silage_income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own silage income" ON silage_income;
CREATE POLICY "Users can update own silage income"
  ON silage_income FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own silage income" ON silage_income;
CREATE POLICY "Users can delete own silage income"
  ON silage_income FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_silage_harvests_user_date ON silage_harvests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_silage_income_user_date ON silage_income(user_id, date DESC);

CREATE TABLE IF NOT EXISTS silage_expenses (
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

ALTER TABLE silage_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm team can view all silage expenses" ON silage_expenses;
CREATE POLICY "Farm team can view all silage expenses"
  ON silage_expenses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Farm team can insert silage expenses" ON silage_expenses;
CREATE POLICY "Farm team can insert silage expenses"
  ON silage_expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own silage expenses" ON silage_expenses;
CREATE POLICY "Users can update own silage expenses"
  ON silage_expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own silage expenses" ON silage_expenses;
CREATE POLICY "Users can delete own silage expenses"
  ON silage_expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_silage_expenses_user_date ON silage_expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_silage_expenses_category ON silage_expenses(user_id, category);
