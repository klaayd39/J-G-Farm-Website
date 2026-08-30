-- Migration: Restrict updates/deletes to record creator (single-owner farm app)
-- Run in Supabase SQL Editor

DROP POLICY IF EXISTS "Farm team can update all harvests" ON harvests;
DROP POLICY IF EXISTS "Farm team can delete all harvests" ON harvests;
CREATE POLICY "Users can update own harvests"
  ON harvests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own harvests"
  ON harvests FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Farm team can update all income" ON income;
DROP POLICY IF EXISTS "Farm team can delete all income" ON income;
CREATE POLICY "Users can update own income"
  ON income FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income"
  ON income FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Farm team can update all expenses" ON expenses;
DROP POLICY IF EXISTS "Farm team can delete all expenses" ON expenses;
CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- All authenticated users can still read shared farm data (SELECT policies unchanged)
