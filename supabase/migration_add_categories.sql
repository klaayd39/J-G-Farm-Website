-- Migration: Add 'gas' and 'meal' to expense_category enum
-- Run this in your Supabase SQL Editor:

ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'gas';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'meal';
