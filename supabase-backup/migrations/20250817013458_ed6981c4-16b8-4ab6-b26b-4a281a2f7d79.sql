-- Remove all customer-related database objects

-- First drop any foreign key constraints that reference customers table
-- (checking invoices and offers tables that might reference customers)

-- Drop customers table completely
DROP TABLE IF EXISTS public.customers CASCADE;

-- Remove any customer-related functions
DROP FUNCTION IF EXISTS public.delete_customer_by_id(uuid) CASCADE;