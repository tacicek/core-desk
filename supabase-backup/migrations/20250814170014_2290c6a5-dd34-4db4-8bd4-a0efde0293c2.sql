-- Since views cannot have RLS policies, we'll replace them with materialized views
-- that can have proper RLS and are refreshed automatically

-- Drop the existing views
DROP VIEW IF EXISTS public.annual_summary;
DROP VIEW IF EXISTS public.tax_report_view;

-- Create materialized view for annual summary with RLS support
CREATE MATERIALIZED VIEW public.annual_summary AS
SELECT 
  be.vendor_id,
  EXTRACT(year FROM be.expense_date) as year,
  be.tax_category as category,
  SUM(be.amount) as total_amount,
  COUNT(*) as entry_count
FROM public.business_expenses be
WHERE be.expense_date IS NOT NULL
GROUP BY be.vendor_id, EXTRACT(year FROM be.expense_date), be.tax_category;

-- Create materialized view for tax report with RLS support  
CREATE MATERIALIZED VIEW public.tax_report_view AS
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

-- Enable RLS on both materialized views
ALTER MATERIALIZED VIEW public.annual_summary ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW public.tax_report_view ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for annual_summary
CREATE POLICY "Users can only access their vendor's annual summary"
ON public.annual_summary
FOR SELECT
TO authenticated
USING (vendor_id = get_user_vendor_id());

-- Create RLS policies for tax_report_view
CREATE POLICY "Users can only access their vendor's tax reports"
ON public.tax_report_view  
FOR SELECT
TO authenticated
USING (vendor_id = get_user_vendor_id());

-- Grant permissions
GRANT SELECT ON public.annual_summary TO authenticated;
GRANT SELECT ON public.tax_report_view TO authenticated;

-- Create function to refresh materialized views when business_expenses change
CREATE OR REPLACE FUNCTION public.refresh_financial_summaries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.annual_summary;
  REFRESH MATERIALIZED VIEW public.tax_report_view;
  RETURN NULL;
END;
$$;

-- Create trigger to auto-refresh materialized views
CREATE TRIGGER refresh_summaries_on_expense_change
  AFTER INSERT OR UPDATE OR DELETE ON public.business_expenses
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_financial_summaries();