-- Check the current RLS policy for customers DELETE
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'customers' AND cmd = 'DELETE';

-- Update the DELETE policy to be more permissive for vendor owners
DROP POLICY IF EXISTS "customers_vendor_modify" ON public.customers;

-- Create separate policies for different operations
CREATE POLICY "customers_vendor_select" ON public.customers
    FOR SELECT USING (vendor_id = get_user_vendor_id());

CREATE POLICY "customers_vendor_insert" ON public.customers
    FOR INSERT WITH CHECK (vendor_id = get_user_vendor_id());

CREATE POLICY "customers_vendor_update" ON public.customers
    FOR UPDATE USING (vendor_id = get_user_vendor_id())
    WITH CHECK (vendor_id = get_user_vendor_id());

CREATE POLICY "customers_vendor_delete" ON public.customers
    FOR DELETE USING (vendor_id = get_user_vendor_id());