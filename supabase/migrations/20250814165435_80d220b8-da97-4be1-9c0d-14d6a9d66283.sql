-- Since views cannot have RLS directly, we'll create security definer functions 
-- that enforce vendor access control for these financial summaries

-- Create a secure function for annual summary data
CREATE OR REPLACE FUNCTION public.get_annual_summary()
RETURNS TABLE (
  vendor_id uuid,
  year numeric,
  category text,
  total_amount numeric,
  entry_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    be.vendor_id,
    EXTRACT(year FROM be.expense_date) as year,
    be.tax_category as category,
    SUM(be.amount) as total_amount,
    COUNT(*) as entry_count
  FROM public.business_expenses be
  WHERE be.expense_date IS NOT NULL
    AND be.vendor_id = get_user_vendor_id()  -- Enforce vendor access
  GROUP BY be.vendor_id, EXTRACT(year FROM be.expense_date), be.tax_category;
$$;

-- Create a secure function for tax report data
CREATE OR REPLACE FUNCTION public.get_tax_report()
RETURNS TABLE (
  vendor_id uuid,
  tax_year numeric,
  tax_month numeric,
  tax_category text,
  category_name text,
  total_net numeric,
  total_vat numeric,
  total_amount numeric,
  expense_count bigint,
  expense_types text[]
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    be.vendor_id,
    EXTRACT(year FROM be.expense_date) as tax_year,
    EXTRACT(month FROM be.expense_date) as tax_month,
    be.tax_category,
    tc.name_de as category_name,
    SUM(be.net_amount) as total_net,
    SUM(be.vat_amount) as total_vat,
    SUM(be.amount) as total_amount,
    COUNT(*) as expense_count,
    array_agg(DISTINCT be.expense_type) as expense_types
  FROM public.business_expenses be
  LEFT JOIN public.tax_categories tc ON be.tax_category = tc.id
  WHERE be.expense_date IS NOT NULL
    AND be.vendor_id = get_user_vendor_id()  -- Enforce vendor access
  GROUP BY 
    be.vendor_id,
    EXTRACT(year FROM be.expense_date),
    EXTRACT(month FROM be.expense_date),
    be.tax_category,
    tc.name_de;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_annual_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tax_report() TO authenticated;

-- Update the views to filter by vendor_id for additional security
DROP VIEW IF EXISTS public.annual_summary;
DROP VIEW IF EXISTS public.tax_report_view;

CREATE VIEW public.annual_summary 
WITH (security_invoker=true) AS
SELECT 
  be.vendor_id,
  EXTRACT(year FROM be.expense_date) as year,
  be.tax_category as category,
  SUM(be.amount) as total_amount,
  COUNT(*) as entry_count
FROM public.business_expenses be
WHERE be.expense_date IS NOT NULL
GROUP BY be.vendor_id, EXTRACT(year FROM be.expense_date), be.tax_category;

CREATE VIEW public.tax_report_view
WITH (security_invoker=true) AS
SELECT 
  be.vendor_id,
  EXTRACT(year FROM be.expense_date) as tax_year,
  EXTRACT(month FROM be.expense_date) as tax_month,
  be.tax_category,
  tc.name_de as category_name,
  SUM(be.net_amount) as total_net,
  SUM(be.vat_amount) as total_vat,
  SUM(be.amount) as total_amount,
  COUNT(*) as expense_count,
  array_agg(DISTINCT be.expense_type) as expense_types
FROM public.business_expenses be
LEFT JOIN public.tax_categories tc ON be.tax_category = tc.id
WHERE be.expense_date IS NOT NULL
GROUP BY 
  be.vendor_id,
  EXTRACT(year FROM be.expense_date),
  EXTRACT(month FROM be.expense_date),
  be.tax_category,
  tc.name_de;