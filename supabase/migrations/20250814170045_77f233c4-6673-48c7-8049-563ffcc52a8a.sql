-- Drop the materialized views
DROP MATERIALIZED VIEW IF EXISTS public.annual_summary;
DROP MATERIALIZED VIEW IF EXISTS public.tax_report_view;

-- Create tables instead of views for proper RLS support
CREATE TABLE public.annual_summary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL,
  year numeric NOT NULL,
  category text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  entry_count bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.tax_report_view (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL,
  tax_year numeric NOT NULL,
  tax_month numeric NOT NULL,
  tax_category text NOT NULL,
  category_name text,
  total_net numeric DEFAULT 0,
  total_vat numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  expense_count bigint DEFAULT 0,
  expense_types text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.annual_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_report_view ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for annual_summary
CREATE POLICY "Users can only access their vendor's annual summary"
ON public.annual_summary
FOR SELECT
TO authenticated
USING (vendor_id = get_user_vendor_id());

CREATE POLICY "System can manage annual summary data"
ON public.annual_summary
FOR ALL
TO service_role
USING (true);

-- Create RLS policies for tax_report_view
CREATE POLICY "Users can only access their vendor's tax reports"
ON public.tax_report_view  
FOR SELECT
TO authenticated
USING (vendor_id = get_user_vendor_id());

CREATE POLICY "System can manage tax report data"
ON public.tax_report_view
FOR ALL
TO service_role
USING (true);

-- Grant permissions
GRANT SELECT ON public.annual_summary TO authenticated;
GRANT SELECT ON public.tax_report_view TO authenticated;

-- Create function to refresh the summary tables when business_expenses change
CREATE OR REPLACE FUNCTION public.refresh_financial_summaries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Clear existing data
  TRUNCATE public.annual_summary;
  TRUNCATE public.tax_report_view;
  
  -- Populate annual_summary
  INSERT INTO public.annual_summary (vendor_id, year, category, total_amount, entry_count)
  SELECT 
    be.vendor_id,
    EXTRACT(year FROM be.expense_date) as year,
    be.tax_category as category,
    SUM(be.amount) as total_amount,
    COUNT(*) as entry_count
  FROM public.business_expenses be
  WHERE be.expense_date IS NOT NULL
  GROUP BY be.vendor_id, EXTRACT(year FROM be.expense_date), be.tax_category;
  
  -- Populate tax_report_view
  INSERT INTO public.tax_report_view (
    vendor_id, tax_year, tax_month, tax_category, category_name,
    total_net, total_vat, total_amount, expense_count, expense_types
  )
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
END;
$$;

-- Create trigger to auto-refresh summary tables
CREATE OR REPLACE FUNCTION public.trigger_refresh_summaries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.refresh_financial_summaries();
  RETURN NULL;
END;
$$;

CREATE TRIGGER refresh_summaries_on_expense_change
  AFTER INSERT OR UPDATE OR DELETE ON public.business_expenses
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_summaries();

-- Initial population of the tables
SELECT public.refresh_financial_summaries();