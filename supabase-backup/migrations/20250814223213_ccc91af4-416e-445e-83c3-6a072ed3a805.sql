-- Add missing VAT-related columns to daily_revenue table
ALTER TABLE public.daily_revenue 
ADD COLUMN vat_category text,
ADD COLUMN vat_rate numeric,
ADD COLUMN vat_amount numeric,
ADD COLUMN net_amount numeric;