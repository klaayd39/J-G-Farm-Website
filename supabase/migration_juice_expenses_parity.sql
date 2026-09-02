-- Align juice_expenses with harvest expenses (category + receipt)
-- Run in Supabase SQL Editor after migration_juice_module.sql

ALTER TABLE juice_expenses
  ADD COLUMN IF NOT EXISTS category expense_category NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS receipt_url TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_juice_expenses_category ON juice_expenses(user_id, category);
