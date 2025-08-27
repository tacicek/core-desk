-- Enable Row Level Security on the views
ALTER VIEW public.annual_summary ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.tax_report_view ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for annual_summary view
CREATE POLICY "Users can only see their vendor's annual summary"
ON public.annual_summary
FOR SELECT
TO authenticated
USING (vendor_id = get_user_vendor_id());

-- Create RLS policies for tax_report_view
CREATE POLICY "Users can only see their vendor's tax reports"
ON public.tax_report_view  
FOR SELECT
TO authenticated
USING (vendor_id = get_user_vendor_id());

-- Ensure the views have proper permissions
GRANT SELECT ON public.annual_summary TO authenticated;
GRANT SELECT ON public.tax_report_view TO authenticated;