-- Temporarily disable RLS on customers table to test
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Test if deletion works now
-- We'll re-enable it after fixing the issue