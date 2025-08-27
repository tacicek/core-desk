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
-- Create a function to verify user has access to specific customer
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

-- Add audit logging for customer data access
CREATE TABLE IF NOT EXISTS public.customer_access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  action text NOT NULL,
  accessed_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit logs
ALTER TABLE public.customer_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view customer access logs" 
ON public.customer_access_logs 
FOR SELECT 
USING (is_super_admin_safe());

-- System can insert audit logs
CREATE POLICY "System can insert customer access logs" 
ON public.customer_access_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add more restrictive policies for sensitive customer operations
-- Drop and recreate customer policies to be more explicit
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

-- Add trigger to log customer access for audit purposes
CREATE OR REPLACE FUNCTION public.log_customer_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log customer data access for audit purposes
  INSERT INTO public.customer_access_logs (
    user_id, 
    customer_id, 
    action,
    accessed_at
  ) VALUES (
    auth.uid(), 
    COALESCE(NEW.id, OLD.id), 
    TG_OP,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS customers_audit_trigger ON public.customers;
CREATE TRIGGER customers_audit_trigger
  AFTER SELECT, INSERT, UPDATE, DELETE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_customer_access();