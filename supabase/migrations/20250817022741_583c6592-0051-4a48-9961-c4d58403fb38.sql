-- Test if we can insert a simple invoice to debug the issue
-- First, let's check if there are any constraints that might cause DELETE issues
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.invoices'::regclass
   OR conrelid = 'public.invoice_items'::regclass;