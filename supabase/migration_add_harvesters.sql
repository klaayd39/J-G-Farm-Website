-- Migration: Add num_harvesters to harvests table
-- Run this in your Supabase SQL Editor:

ALTER TABLE harvests ADD COLUMN IF NOT EXISTS num_harvesters INTEGER DEFAULT 0;
