-- Check current view definitions to identify SECURITY DEFINER views
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND (definition ILIKE '%SECURITY DEFINER%' OR viewowner != 'authenticator');

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public.annual_summary;
DROP VIEW IF EXISTS public.tax_report_view;

-- Recreate annual_summary view without SECURITY DEFINER
CREATE VIEW public.annual_summary AS
SELECT 
  be.vendor_id,
  EXTRACT(year FROM be.expense_date) as year,
  be.tax_category as category,
  SUM(be.amount) as total_amount,
  COUNT(*) as entry_count
FROM public.business_expenses be
WHERE be.expense_date IS NOT NULL
GROUP BY be.vendor_id, EXTRACT(year FROM be.expense_date), be.tax_category;

-- Enable RLS on annual_summary
ALTER VIEW public.annual_summary SET (security_invoker = true);

-- Recreate tax_report_view without SECURITY DEFINER  
CREATE VIEW public.tax_report_view AS
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

-- Enable RLS on tax_report_view
ALTER VIEW public.tax_report_view SET (security_invoker = true);

-- Create RLS policies for the views
CREATE POLICY "annual_summary_vendor_access" ON public.annual_summary
  FOR SELECT USING (vendor_id = get_user_vendor_id());

CREATE POLICY "tax_report_view_vendor_access" ON public.tax_report_view  
  FOR SELECT USING (vendor_id = get_user_vendor_id());

-- Enable RLS on both views
ALTER VIEW public.annual_summary ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.tax_report_view ENABLE ROW LEVEL SECURITY;