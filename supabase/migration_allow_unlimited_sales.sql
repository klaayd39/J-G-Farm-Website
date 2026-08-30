-- Allow sales larger than remaining harvest inventory
-- Run in Supabase SQL Editor if the oversell trigger is already installed

DROP TRIGGER IF EXISTS check_harvest_sale_inventory ON income;
DROP FUNCTION IF EXISTS public.check_harvest_sale_inventory();
