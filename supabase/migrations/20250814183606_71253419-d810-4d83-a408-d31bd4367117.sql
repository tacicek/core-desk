-- Update the refresh_financial_summaries function to include all revenue sources
CREATE OR REPLACE FUNCTION refresh_financial_summaries()
RETURNS void AS $$
BEGIN
  -- Clear existing data
  DELETE FROM annual_summary;
  DELETE FROM tax_report_view;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to refresh summaries when data changes
DROP TRIGGER IF EXISTS refresh_summaries_on_business_expenses ON business_expenses;
DROP TRIGGER IF EXISTS refresh_summaries_on_employee_expenses ON employee_expenses;
DROP TRIGGER IF EXISTS refresh_summaries_on_daily_revenue ON daily_revenue;
DROP TRIGGER IF EXISTS refresh_summaries_on_invoices ON invoices;
DROP TRIGGER IF EXISTS refresh_summaries_on_incoming_invoices ON incoming_invoices;

CREATE TRIGGER refresh_summaries_on_business_expenses
AFTER INSERT OR UPDATE OR DELETE ON business_expenses
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_financial_summaries();

CREATE TRIGGER refresh_summaries_on_employee_expenses
AFTER INSERT OR UPDATE OR DELETE ON employee_expenses
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_financial_summaries();

CREATE TRIGGER refresh_summaries_on_daily_revenue
AFTER INSERT OR UPDATE OR DELETE ON daily_revenue
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_financial_summaries();

CREATE TRIGGER refresh_summaries_on_invoices
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_financial_summaries();

CREATE TRIGGER refresh_summaries_on_incoming_invoices
AFTER INSERT OR UPDATE OR DELETE ON incoming_invoices
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_financial_summaries();

-- Refresh the summaries with current data
SELECT refresh_financial_summaries();