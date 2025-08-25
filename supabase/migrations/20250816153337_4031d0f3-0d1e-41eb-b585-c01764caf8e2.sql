-- Fix RLS policies for critical admin tables

-- 1. Fix admin_users table policies
-- Add missing INSERT, UPDATE, DELETE policies for super admins
CREATE POLICY "Super admins can insert admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

CREATE POLICY "Super admins can update admin users" 
ON public.admin_users 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

CREATE POLICY "Super admins can delete admin users" 
ON public.admin_users 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- 2. Fix audit_logs table policies
-- Add INSERT policy for system operations (service role can insert audit logs)
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (
  -- Allow service role or super admins to insert audit logs
  auth.role() = 'service_role' OR 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Add UPDATE and DELETE policies for super admins only
CREATE POLICY "Super admins can update audit logs" 
ON public.audit_logs 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

CREATE POLICY "Super admins can delete audit logs" 
ON public.audit_logs 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- 3. Ensure support_tickets has proper user access
-- Allow regular users to create tickets for their own tenant
CREATE POLICY "Users can create support tickets for their tenant" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (
  -- Users can create tickets for their own tenant
  tenant_id = (
    SELECT tenant_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ) OR
  -- Super admins can create tickets for any tenant
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Allow users to view tickets for their own tenant
CREATE POLICY "Users can view their tenant support tickets" 
ON public.support_tickets 
FOR SELECT 
USING (
  -- Users can view tickets for their own tenant
  tenant_id = (
    SELECT tenant_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ) OR
  -- Super admins can view all tickets
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Allow users to update their own tenant tickets (status updates)
CREATE POLICY "Users can update their tenant support tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (
  -- Users can update tickets for their own tenant
  tenant_id = (
    SELECT tenant_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ) OR
  -- Super admins can update all tickets
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- 4. Add comprehensive tenant access policies
-- Allow users to view their own tenant information
CREATE POLICY "Users can view their own tenant" 
ON public.tenants 
FOR SELECT 
USING (
  -- Users can view their own tenant
  id = (
    SELECT tenant_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ) OR
  -- Super admins can view all tenants
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Allow tenant owners to update basic tenant information
CREATE POLICY "Tenant owners can update basic tenant info" 
ON public.tenants 
FOR UPDATE 
USING (
  -- Tenant owners can update basic info for their tenant
  (id = (
    SELECT tenant_id FROM public.user_profiles 
    WHERE user_id = auth.uid() AND is_owner = true
  )) OR
  -- Super admins can update all tenants
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- 5. Add subscription viewing for tenant users
CREATE POLICY "Users can view their tenant subscription" 
ON public.subscriptions 
FOR SELECT 
USING (
  -- Users can view subscription for their own tenant
  tenant_id = (
    SELECT tenant_id FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ) OR
  -- Super admins can view all subscriptions
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);