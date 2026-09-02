-- Calamansi Juice module: sales (bottles by size) + expenses (boxes by size)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS juice_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  buyer TEXT NOT NULL DEFAULT '',
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT juice_sales_lines_array CHECK (jsonb_typeof(lines) = 'array')
);

ALTER TABLE juice_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm team can view all juice sales" ON juice_sales;
CREATE POLICY "Farm team can view all juice sales"
  ON juice_sales FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Farm team can insert juice sales" ON juice_sales;
CREATE POLICY "Farm team can insert juice sales"
  ON juice_sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own juice sales" ON juice_sales;
CREATE POLICY "Users can update own juice sales"
  ON juice_sales FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own juice sales" ON juice_sales;
CREATE POLICY "Users can delete own juice sales"
  ON juice_sales FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS juice_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT juice_expenses_lines_array CHECK (jsonb_typeof(lines) = 'array')
);

ALTER TABLE juice_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm team can view all juice expenses" ON juice_expenses;
CREATE POLICY "Farm team can view all juice expenses"
  ON juice_expenses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Farm team can insert juice expenses" ON juice_expenses;
CREATE POLICY "Farm team can insert juice expenses"
  ON juice_expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own juice expenses" ON juice_expenses;
CREATE POLICY "Users can update own juice expenses"
  ON juice_expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own juice expenses" ON juice_expenses;
CREATE POLICY "Users can delete own juice expenses"
  ON juice_expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_juice_sales_user_date ON juice_sales(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_juice_expenses_user_date ON juice_expenses(user_id, date DESC);
