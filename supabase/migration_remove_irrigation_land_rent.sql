-- Migration: Remove 'irrigation' and 'land_rent' expense categories
-- Run in Supabase SQL Editor after backing up if needed.

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
