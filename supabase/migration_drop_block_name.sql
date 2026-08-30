-- Migration: Drop unused block_name column from harvests
ALTER TABLE harvests DROP COLUMN IF EXISTS block_name;
