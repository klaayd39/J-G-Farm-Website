-- Combined bag + loose sales: one row with correct total income (₱500 + ₱450 = ₱950)
-- Run in Supabase SQL Editor

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
