-- Super Napier Silage module: expenses ledger
-- Run in Supabase SQL Editor (after migration_silage_module.sql if tables already exist)

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
