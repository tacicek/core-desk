-- Drop existing views
DROP VIEW IF EXISTS public.annual_summary;
DROP VIEW IF EXISTS public.tax_report_view;

-- Recreate annual_summary view with SECURITY INVOKER (default behavior)
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

-- Recreate tax_report_view with SECURITY INVOKER (default behavior)
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