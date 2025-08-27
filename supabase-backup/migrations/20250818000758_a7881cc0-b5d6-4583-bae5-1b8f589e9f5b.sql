-- Fix the refresh_financial_summaries function to be safer with DELETE operations
CREATE OR REPLACE FUNCTION public.refresh_financial_summaries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Clear existing data with proper WHERE clauses
  DELETE FROM annual_summary WHERE id IS NOT NULL;
  DELETE FROM tax_report_view WHERE id IS NOT NULL;

  -- Insert annual business expenses summary
  INSERT INTO annual_summary (vendor_id, year, category, total_amount, entry_count)
  SELECT 
    vendor_id,
    EXTRACT(year FROM expense_date) as year,
    'business_expenses' as category,
    SUM(amount) as total_amount,
    COUNT(*) as entry_count
  FROM business_expenses
  WHERE expense_date IS NOT NULL
  GROUP BY vendor_id, EXTRACT(year FROM expense_date);

  -- Insert annual employee expenses summary
  INSERT INTO annual_summary (vendor_id, year, category, total_amount, entry_count)
  SELECT 
    vendor_id,
    EXTRACT(year FROM expense_date) as year,
    'employee_expenses' as category,
    SUM(amount) as total_amount,
    COUNT(*) as entry_count
  FROM employee_expenses
  WHERE expense_date IS NOT NULL
  GROUP BY vendor_id, EXTRACT(year FROM expense_date);

  -- Insert annual incoming invoices summary
  INSERT INTO annual_summary (vendor_id, year, category, total_amount, entry_count)
  SELECT 
    vendor_id,
    EXTRACT(year FROM COALESCE(invoice_date, created_at::date)) as year,
    'incoming_invoices' as category,
    SUM(amount) as total_amount,
    COUNT(*) as entry_count
  FROM incoming_invoices
  WHERE COALESCE(invoice_date, created_at::date) IS NOT NULL
  GROUP BY vendor_id, EXTRACT(year FROM COALESCE(invoice_date, created_at::date));

  -- Insert annual revenue summary (from daily_revenue + paid invoices)
  WITH revenue_data AS (
    -- Daily revenue entries
    SELECT 
      vendor_id,
      EXTRACT(year FROM revenue_date) as year,
      SUM(amount) as total_amount,
      COUNT(*) as entry_count
    FROM daily_revenue
    WHERE revenue_date IS NOT NULL
    GROUP BY vendor_id, EXTRACT(year FROM revenue_date)
    
    UNION ALL
    
    -- Paid invoices as revenue
    SELECT 
      vendor_id,
      EXTRACT(year FROM issue_date) as year,
      SUM(total) as total_amount,
      COUNT(*) as entry_count
    FROM invoices
    WHERE status = 'paid' AND issue_date IS NOT NULL
    GROUP BY vendor_id, EXTRACT(year FROM issue_date)
  )
  INSERT INTO annual_summary (vendor_id, year, category, total_amount, entry_count)
  SELECT 
    vendor_id,
    year,
    'revenue' as category,
    SUM(total_amount) as total_amount,
    SUM(entry_count) as entry_count
  FROM revenue_data
  GROUP BY vendor_id, year;

  -- Refresh tax report view data
  INSERT INTO tax_report_view (vendor_id, tax_year, tax_month, tax_category, category_name, total_net, total_vat, total_amount, expense_count, expense_types)
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
  FROM business_expenses be
  LEFT JOIN tax_categories tc ON be.tax_category = tc.id
  WHERE be.expense_date IS NOT NULL
  GROUP BY 
    be.vendor_id,
    EXTRACT(year FROM be.expense_date),
    EXTRACT(month FROM be.expense_date),
    be.tax_category,
    tc.name_de;
END;
$function$;