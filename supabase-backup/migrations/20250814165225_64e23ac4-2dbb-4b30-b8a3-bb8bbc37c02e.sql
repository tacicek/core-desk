-- Check for any views that might be owned by postgres instead of authenticator
SELECT schemaname, viewname, viewowner 
FROM pg_views 
WHERE schemaname = 'public';

-- Set all views to security invoker explicitly
ALTER VIEW IF EXISTS public.annual_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.tax_report_view SET (security_invoker = true);

-- Also check if there are any other problematic views
SELECT 
  n.nspname as schema_name,
  c.relname as view_name,
  pg_get_userbyid(c.relowner) as owner,
  CASE 
    WHEN c.relkind = 'v' THEN 'view'
    WHEN c.relkind = 'm' THEN 'materialized view'
  END as type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('v', 'm')
  AND n.nspname = 'public'
  AND pg_get_userbyid(c.relowner) != 'authenticator';

-- Change ownership of any problematic views to authenticator
ALTER VIEW IF EXISTS public.annual_summary OWNER TO authenticator;
ALTER VIEW IF EXISTS public.tax_report_view OWNER TO authenticator;