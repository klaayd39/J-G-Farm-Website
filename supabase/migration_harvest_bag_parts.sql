-- Migration: Store harvest as red bags + loose kilos (source of truth for 1.56 bag math)
-- Run in Supabase SQL Editor

ALTER TABLE harvests ADD COLUMN IF NOT EXISTS num_red_bags NUMERIC(10,2) DEFAULT 0;
ALTER TABLE harvests ADD COLUMN IF NOT EXISTS loose_kg NUMERIC(10,2) DEFAULT 0;

UPDATE harvests
SET
  num_red_bags = FLOOR(kg_harvested / 27),
  loose_kg = ROUND(kg_harvested - FLOOR(kg_harvested / 27) * 27, 2)
WHERE kg_harvested > 0;
