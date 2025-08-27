-- Fix security definer view issue by recreating without security definer
DROP VIEW IF EXISTS public.tax_report_view;

-- Create view without SECURITY DEFINER (uses invoker permissions)
CREATE VIEW public.tax_report_view AS
SELECT 
  be.vendor_id,
  EXTRACT(YEAR FROM be.expense_date) as tax_year,
  EXTRACT(MONTH FROM be.expense_date) as tax_month,
  be.tax_category,
  tc.name_de as category_name,
  COUNT(*) as expense_count,
  SUM(be.amount) as total_amount,
  SUM(be.vat_amount) as total_vat,
  SUM(be.net_amount) as total_net,
  ARRAY_AGG(DISTINCT be.expense_type) as expense_types
FROM public.business_expenses be
LEFT JOIN public.tax_categories tc ON be.tax_category = tc.id
WHERE be.status = 'paid' AND be.vendor_id = get_user_vendor_id()
GROUP BY be.vendor_id, tax_year, tax_month, be.tax_category, tc.name_de, tc.sort_order
ORDER BY tax_year DESC, tax_month DESC, tc.sort_order;