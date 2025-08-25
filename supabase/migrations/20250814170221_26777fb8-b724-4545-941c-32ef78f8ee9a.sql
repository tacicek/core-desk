-- Drop any existing views/tables with these names
DROP VIEW IF EXISTS public.annual_summary CASCADE;
DROP VIEW IF EXISTS public.tax_report_view CASCADE;
DROP TABLE IF EXISTS public.annual_summary CASCADE;
DROP TABLE IF EXISTS public.tax_report_view CASCADE;

-- Create tables for proper RLS support
CREATE TABLE public.annual_summary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL,
  year numeric NOT NULL,
  category text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  entry_count bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(vendor_id, year, category)
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
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(vendor_id, tax_year, tax_month, tax_category)
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

-- Create RLS policies for tax_report_view
CREATE POLICY "Users can only access their vendor's tax reports"
ON public.tax_report_view  
FOR SELECT
TO authenticated
USING (vendor_id = get_user_vendor_id());

-- Grant permissions
GRANT SELECT ON public.annual_summary TO authenticated;
GRANT SELECT ON public.tax_report_view TO authenticated;