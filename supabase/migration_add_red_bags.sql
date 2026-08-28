-- Migration: Add red bag fields to income table
-- Run this in your Supabase SQL Editor:

ALTER TABLE income ADD COLUMN IF NOT EXISTS num_red_bags NUMERIC(10,2) DEFAULT 0;
ALTER TABLE income ADD COLUMN IF NOT EXISTS price_per_red_bag NUMERIC(10,2) DEFAULT 0;
