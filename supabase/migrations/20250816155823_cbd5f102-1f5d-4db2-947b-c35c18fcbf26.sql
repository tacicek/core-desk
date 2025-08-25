-- Fix infinite recursion in admin_users RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;

-- Create a security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  -- Get current user ID and check directly in admin_users table
  -- This avoids recursion by not using RLS policies inside the function
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

-- Recreate admin_users policies using the safe function
CREATE POLICY "Super admins can view all admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_super_admin_safe());

CREATE POLICY "Super admins can insert admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (public.is_super_admin_safe());

CREATE POLICY "Super admins can update admin users" 
ON public.admin_users 
FOR UPDATE 
USING (public.is_super_admin_safe());

CREATE POLICY "Super admins can delete admin users" 
ON public.admin_users 
FOR DELETE 
USING (public.is_super_admin_safe());