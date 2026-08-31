-- Calamansi Juice module tables
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS juice_harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  num_bags NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (num_bags >= 0),
  num_cuttings NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (num_cuttings >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (num_bags > 0 OR num_cuttings > 0)
);

ALTER TABLE juice_harvests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm team can view all juice harvests" ON juice_harvests;
CREATE POLICY "Farm team can view all juice harvests"
  ON juice_harvests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Farm team can insert juice harvests" ON juice_harvests;
CREATE POLICY "Farm team can insert juice harvests"
  ON juice_harvests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own juice harvests" ON juice_harvests;
CREATE POLICY "Users can update own juice harvests"
  ON juice_harvests FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own juice harvests" ON juice_harvests;
CREATE POLICY "Users can delete own juice harvests"
  ON juice_harvests FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS juice_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sale_time TIME,
  buyer TEXT NOT NULL DEFAULT '',
  num_bags NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (num_bags >= 0),
  price_per_bag NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price_per_bag >= 0),
  num_cuttings NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (num_cuttings >= 0),
  price_per_cutting NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price_per_cutting >= 0),
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (
    (COALESCE(num_bags, 0) * COALESCE(price_per_bag, 0))
    + (COALESCE(num_cuttings, 0) * COALESCE(price_per_cutting, 0))
  ) STORED,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (num_bags > 0 OR num_cuttings > 0)
);

ALTER TABLE juice_income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm team can view all juice income" ON juice_income;
CREATE POLICY "Farm team can view all juice income"
  ON juice_income FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Farm team can insert juice income" ON juice_income;
CREATE POLICY "Farm team can insert juice income"
  ON juice_income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own juice income" ON juice_income;
CREATE POLICY "Users can update own juice income"
  ON juice_income FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own juice income" ON juice_income;
CREATE POLICY "Users can delete own juice income"
  ON juice_income FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_juice_harvests_user_date ON juice_harvests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_juice_income_user_date ON juice_income(user_id, date DESC);
