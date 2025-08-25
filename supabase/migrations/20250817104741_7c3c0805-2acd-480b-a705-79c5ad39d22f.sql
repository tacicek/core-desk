-- Improve security for database functions by setting proper search_path
-- This fixes the "Function Search Path Mutable" warnings

-- Update get_user_vendor_id function to be more secure
CREATE OR REPLACE FUNCTION public.get_user_vendor_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT vendor_id FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Update is_vendor_owner function to be more secure
CREATE OR REPLACE FUNCTION public.is_vendor_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT is_owner FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Update is_super_admin_safe function to be more secure
CREATE OR REPLACE FUNCTION public.is_super_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (
      SELECT admin_users.is_super_admin 
      FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
      LIMIT 1
    ), 
    false
  );
$$;

-- Add additional security check for customers table
CREATE OR REPLACE FUNCTION public.user_can_access_customer(customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.customers c
    JOIN public.user_profiles up ON c.vendor_id = up.vendor_id
    WHERE c.id = customer_id 
    AND up.user_id = auth.uid()
  );
$$;

-- Drop and recreate customer policies to be more explicit and secure
DROP POLICY IF EXISTS "customers_vendor_modify" ON public.customers;
DROP POLICY IF EXISTS "customers_vendor_select" ON public.customers;

-- More granular policies for better security
CREATE POLICY "Users can view customers in their vendor" 
ON public.customers 
FOR SELECT 
USING (
  vendor_id = get_user_vendor_id() 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can insert customers for their vendor" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  vendor_id = get_user_vendor_id() 
  AND auth.uid() IS NOT NULL 
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update customers in their vendor" 
ON public.customers 
FOR UPDATE 
USING (
  vendor_id = get_user_vendor_id() 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Only vendor owners can delete customers" 
ON public.customers 
FOR DELETE 
USING (
  vendor_id = get_user_vendor_id() 
  AND is_vendor_owner()
);