-- Migration: Sale time + view all profiles (for "logged by" on income ledger)
-- Run in Supabase SQL Editor

ALTER TABLE income ADD COLUMN IF NOT EXISTS sale_time TIME;

DROP POLICY IF EXISTS "Farm team can view all profiles" ON profiles;
CREATE POLICY "Farm team can view all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);
