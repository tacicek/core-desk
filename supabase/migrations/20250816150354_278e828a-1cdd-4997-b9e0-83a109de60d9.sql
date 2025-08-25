-- Fix function search path issues by updating existing functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.admin_users WHERE user_id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_stats()
RETURNS TABLE(
  total_tenants bigint,
  active_tenants bigint,
  trial_tenants bigint,
  suspended_tenants bigint,
  total_revenue numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    COUNT(*)::bigint as total_tenants,
    COUNT(*) FILTER (WHERE t.status = 'active')::bigint as active_tenants,
    COUNT(*) FILTER (WHERE t.status = 'trial')::bigint as trial_tenants,
    COUNT(*) FILTER (WHERE t.status = 'suspended')::bigint as suspended_tenants,
    COALESCE(SUM(s.price), 0) as total_revenue
  FROM public.tenants t
  LEFT JOIN public.subscriptions s ON t.id = s.tenant_id AND s.status = 'active';
$$;