-- ============================================================
-- J&G Farm — Apply all pending schema updates (Aug 2026)
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run (uses IF NOT EXISTS / conditional checks)
-- ============================================================

-- 1. Harvest: store red bags + loose kilos (1 bag + 15 kg = 1.56 bags)
ALTER TABLE harvests ADD COLUMN IF NOT EXISTS num_red_bags NUMERIC(10,2) DEFAULT 0;
ALTER TABLE harvests ADD COLUMN IF NOT EXISTS loose_kg NUMERIC(10,2) DEFAULT 0;

UPDATE harvests
SET
  num_red_bags = FLOOR(kg_harvested / 27),
  loose_kg = ROUND(kg_harvested - FLOOR(kg_harvested / 27) * 27, 2)
WHERE kg_harvested > 0
  AND (
    (COALESCE(num_red_bags, 0) = 0 AND COALESCE(loose_kg, 0) = 0)
    OR ABS((COALESCE(num_red_bags, 0) * 27 + COALESCE(loose_kg, 0)) - kg_harvested) > 0.01
  );

-- 2. Income: combined bag + loose sale total (₱500 + ₱450 = ₱950)
ALTER TABLE income ADD COLUMN IF NOT EXISTS num_red_bags NUMERIC(10,2) DEFAULT 0;
ALTER TABLE income ADD COLUMN IF NOT EXISTS price_per_red_bag NUMERIC(10,2) DEFAULT 0;
ALTER TABLE income ADD COLUMN IF NOT EXISTS loose_kg_sold NUMERIC(10,2) DEFAULT 0;

ALTER TABLE income DROP COLUMN IF EXISTS total_amount;

ALTER TABLE income ADD COLUMN total_amount NUMERIC(12,2) GENERATED ALWAYS AS (
  CASE
    WHEN COALESCE(num_red_bags, 0) > 0 AND COALESCE(price_per_red_bag, 0) > 0
         AND COALESCE(loose_kg_sold, 0) > 0 AND COALESCE(price_per_kg, 0) > 0
      THEN (num_red_bags * price_per_red_bag) + (loose_kg_sold * price_per_kg)
    WHEN COALESCE(num_red_bags, 0) > 0 AND COALESCE(price_per_red_bag, 0) > 0
      THEN (num_red_bags * price_per_red_bag)
    ELSE (kg_sold * price_per_kg)
  END
) STORED;

-- 3. Remove deprecated expense categories (irrigation, land_rent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'expense_category'
      AND e.enumlabel IN ('irrigation', 'land_rent')
  ) THEN
    UPDATE expenses
    SET category = 'other'
    WHERE category::text IN ('irrigation', 'land_rent');

    ALTER TYPE expense_category RENAME TO expense_category_old;

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

    ALTER TABLE expenses
      ALTER COLUMN category TYPE expense_category
      USING category::text::expense_category;

    DROP TYPE expense_category_old;
  END IF;
END $$;

-- 4. Indexes for inventory lookups
CREATE INDEX IF NOT EXISTS idx_income_harvest_id ON income(harvest_id);
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_harvests_user_date ON harvests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(user_id, category);

-- 5. Do not cap sales by remaining harvest inventory
DROP TRIGGER IF EXISTS check_harvest_sale_inventory ON income;
DROP FUNCTION IF EXISTS public.check_harvest_sale_inventory();

-- Done. Refresh Supabase schema cache: Settings → API → Reload schema (if available)
-- or wait ~1 minute for PostgREST to pick up column changes.

-- 6. Sale time on income + shared profile names for "logged by"
ALTER TABLE income ADD COLUMN IF NOT EXISTS sale_time TIME;

DROP POLICY IF EXISTS "Farm team can view all profiles" ON profiles;
CREATE POLICY "Farm team can view all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);
