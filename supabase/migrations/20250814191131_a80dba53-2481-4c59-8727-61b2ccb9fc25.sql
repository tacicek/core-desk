-- Check existing policies first
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'customers';

-- Just recreate the DELETE policy specifically
DROP POLICY IF EXISTS "customers_vendor_delete" ON public.customers;

CREATE POLICY "customers_vendor_delete" ON public.customers
    FOR DELETE USING (vendor_id = get_user_vendor_id());