-- Advanced Analytics Dashboard Migration
-- This migration creates comprehensive analytics views and functions

-- =====================================================
-- 1. ANALYTICS MATERIALIZED VIEWS
-- =====================================================

-- Daily Revenue Analytics
CREATE MATERIALIZED VIEW public.daily_revenue_analytics AS
SELECT 
  vendor_id,
  DATE(created_at) as date,
  COUNT(*) as invoice_count,
  SUM(total) as total_revenue,
  SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN status = 'sent' THEN total ELSE 0 END) as pending_revenue,
  SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END) as overdue_revenue,
  AVG(total) as avg_invoice_value,
  currency,
  created_at as last_updated
FROM public.invoices
WHERE created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY vendor_id, DATE(created_at), currency, created_at;

CREATE UNIQUE INDEX idx_daily_revenue_analytics_unique 
ON public.daily_revenue_analytics (vendor_id, date, currency);

-- Monthly Revenue Analytics
CREATE MATERIALIZED VIEW public.monthly_revenue_analytics AS
SELECT 
  vendor_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as invoice_count,
  SUM(total) as total_revenue,
  SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_revenue,
  COUNT(DISTINCT customer_id) as unique_customers,
  AVG(total) as avg_invoice_value,
  MAX(total) as highest_invoice,
  MIN(total) as lowest_invoice,
  currency,
  MAX(created_at) as last_updated
FROM public.invoices
WHERE created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY vendor_id, DATE_TRUNC('month', created_at), currency;

CREATE UNIQUE INDEX idx_monthly_revenue_analytics_unique 
ON public.monthly_revenue_analytics (vendor_id, month, currency);

-- Customer Analytics
CREATE MATERIALIZED VIEW public.customer_analytics AS
SELECT 
  c.vendor_id,
  c.id as customer_id,
  c.name as customer_name,
  c.email,
  COUNT(i.id) as total_invoices,
  SUM(i.total) as total_revenue,
  SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) as paid_revenue,
  AVG(i.total) as avg_invoice_value,
  MAX(i.created_at) as last_invoice_date,
  MIN(i.created_at) as first_invoice_date,
  COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) as overdue_count,
  CASE 
    WHEN MAX(i.created_at) >= CURRENT_DATE - INTERVAL '30 days' THEN 'active'
    WHEN MAX(i.created_at) >= CURRENT_DATE - INTERVAL '90 days' THEN 'inactive'
    ELSE 'dormant'
  END as status,
  MAX(i.updated_at) as last_updated
FROM public.customers c
LEFT JOIN public.invoices i ON c.id = i.customer_id
GROUP BY c.vendor_id, c.id, c.name, c.email;

CREATE UNIQUE INDEX idx_customer_analytics_unique 
ON public.customer_analytics (vendor_id, customer_id);

-- Product Performance Analytics
CREATE MATERIALIZED VIEW public.product_analytics AS
SELECT 
  p.vendor_id,
  p.id as product_id,
  p.name as product_name,
  p.category,
  COUNT(ii.id) as times_sold,
  SUM(ii.quantity) as total_quantity_sold,
  SUM(ii.line_total) as total_revenue,
  AVG(ii.unit_price) as avg_selling_price,
  MAX(ii.created_at) as last_sold_date,
  COUNT(DISTINCT i.customer_id) as unique_customers,
  MAX(ii.updated_at) as last_updated
FROM public.products p
LEFT JOIN public.invoice_items ii ON p.id = ii.product_id
LEFT JOIN public.invoices i ON ii.invoice_id = i.id
GROUP BY p.vendor_id, p.id, p.name, p.category;

CREATE UNIQUE INDEX idx_product_analytics_unique 
ON public.product_analytics (vendor_id, product_id);

-- Expense Analytics
CREATE MATERIALIZED VIEW public.expense_analytics AS
SELECT 
  vendor_id,
  DATE_TRUNC('month', expense_date) as month,
  expense_type,
  tax_category,
  COUNT(*) as expense_count,
  SUM(amount) as total_amount,
  SUM(net_amount) as total_net_amount,
  SUM(vat_amount) as total_vat_amount,
  AVG(amount) as avg_expense,
  MAX(expense_date) as last_updated
FROM public.business_expenses
WHERE expense_date >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY vendor_id, DATE_TRUNC('month', expense_date), expense_type, tax_category;

CREATE UNIQUE INDEX idx_expense_analytics_unique 
ON public.expense_analytics (vendor_id, month, expense_type, tax_category);

-- =====================================================
-- 2. COMPREHENSIVE ANALYTICS FUNCTIONS
-- =====================================================

-- Revenue Trend Analysis
CREATE OR REPLACE FUNCTION public.get_revenue_trends(
  p_vendor_id UUID,
  p_period TEXT DEFAULT 'month',
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '12 months',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  period_start DATE,
  period_end DATE,
  total_revenue NUMERIC,
  paid_revenue NUMERIC,
  pending_revenue NUMERIC,
  invoice_count BIGINT,
  avg_invoice_value NUMERIC,
  growth_rate NUMERIC,
  period_label TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  prev_revenue NUMERIC := 0;
  current_revenue NUMERIC;
BEGIN
  FOR period_start, period_end, total_revenue, paid_revenue, pending_revenue, invoice_count, avg_invoice_value, period_label IN
    SELECT 
      CASE 
        WHEN p_period = 'day' THEN date
        WHEN p_period = 'week' THEN DATE_TRUNC('week', date)::DATE
        WHEN p_period = 'month' THEN DATE_TRUNC('month', date)::DATE
        WHEN p_period = 'quarter' THEN DATE_TRUNC('quarter', date)::DATE
        WHEN p_period = 'year' THEN DATE_TRUNC('year', date)::DATE
      END as period_start_calc,
      CASE 
        WHEN p_period = 'day' THEN date
        WHEN p_period = 'week' THEN (DATE_TRUNC('week', date) + INTERVAL '6 days')::DATE
        WHEN p_period = 'month' THEN (DATE_TRUNC('month', date) + INTERVAL '1 month - 1 day')::DATE
        WHEN p_period = 'quarter' THEN (DATE_TRUNC('quarter', date) + INTERVAL '3 months - 1 day')::DATE
        WHEN p_period = 'year' THEN (DATE_TRUNC('year', date) + INTERVAL '1 year - 1 day')::DATE
      END as period_end_calc,
      SUM(total_revenue) as total_revenue_calc,
      SUM(paid_revenue) as paid_revenue_calc,
      SUM(pending_revenue) as pending_revenue_calc,
      SUM(invoice_count) as invoice_count_calc,
      AVG(avg_invoice_value) as avg_invoice_calc,
      CASE 
        WHEN p_period = 'day' THEN TO_CHAR(date, 'YYYY-MM-DD')
        WHEN p_period = 'week' THEN 'Week of ' || TO_CHAR(DATE_TRUNC('week', date), 'Mon DD')
        WHEN p_period = 'month' THEN TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY')
        WHEN p_period = 'quarter' THEN 'Q' || EXTRACT(QUARTER FROM date) || ' ' || EXTRACT(YEAR FROM date)
        WHEN p_period = 'year' THEN TO_CHAR(DATE_TRUNC('year', date), 'YYYY')
      END as period_label_calc
    FROM public.daily_revenue_analytics
    WHERE vendor_id = p_vendor_id
      AND date >= p_start_date
      AND date <= p_end_date
    GROUP BY period_start_calc, period_end_calc, period_label_calc
    ORDER BY period_start_calc
  LOOP
    current_revenue := COALESCE(total_revenue, 0);
    
    -- Calculate growth rate
    IF prev_revenue > 0 THEN
      growth_rate := ((current_revenue - prev_revenue) / prev_revenue) * 100;
    ELSE
      growth_rate := NULL;
    END IF;
    
    prev_revenue := current_revenue;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Customer Segmentation Analysis
CREATE OR REPLACE FUNCTION public.get_customer_segmentation(
  p_vendor_id UUID
)
RETURNS TABLE (
  segment TEXT,
  customer_count BIGINT,
  total_revenue NUMERIC,
  avg_revenue_per_customer NUMERIC,
  percentage_of_customers NUMERIC,
  percentage_of_revenue NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total_customers BIGINT;
  total_revenue NUMERIC;
BEGIN
  -- Get totals
  SELECT COUNT(*), SUM(ca.total_revenue)
  INTO total_customers, total_revenue
  FROM public.customer_analytics ca
  WHERE ca.vendor_id = p_vendor_id;
  
  -- High-value customers (top 20% by revenue)
  RETURN QUERY
  SELECT 
    'High Value'::TEXT as segment,
    COUNT(*)::BIGINT as customer_count,
    SUM(ca.total_revenue) as total_revenue,
    AVG(ca.total_revenue) as avg_revenue_per_customer,
    (COUNT(*) * 100.0 / NULLIF(total_customers, 0)) as percentage_of_customers,
    (SUM(ca.total_revenue) * 100.0 / NULLIF(total_revenue, 0)) as percentage_of_revenue
  FROM public.customer_analytics ca
  WHERE ca.vendor_id = p_vendor_id
    AND ca.total_revenue >= (
      SELECT PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY total_revenue)
      FROM public.customer_analytics
      WHERE vendor_id = p_vendor_id
    );
  
  -- Medium-value customers (20-80 percentile)
  RETURN QUERY
  SELECT 
    'Medium Value'::TEXT as segment,
    COUNT(*)::BIGINT as customer_count,
    SUM(ca.total_revenue) as total_revenue,
    AVG(ca.total_revenue) as avg_revenue_per_customer,
    (COUNT(*) * 100.0 / NULLIF(total_customers, 0)) as percentage_of_customers,
    (SUM(ca.total_revenue) * 100.0 / NULLIF(total_revenue, 0)) as percentage_of_revenue
  FROM public.customer_analytics ca
  WHERE ca.vendor_id = p_vendor_id
    AND ca.total_revenue < (
      SELECT PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY total_revenue)
      FROM public.customer_analytics
      WHERE vendor_id = p_vendor_id
    )
    AND ca.total_revenue >= (
      SELECT PERCENTILE_CONT(0.2) WITHIN GROUP (ORDER BY total_revenue)
      FROM public.customer_analytics
      WHERE vendor_id = p_vendor_id
    );
  
  -- Low-value customers (bottom 20%)
  RETURN QUERY
  SELECT 
    'Low Value'::TEXT as segment,
    COUNT(*)::BIGINT as customer_count,
    SUM(ca.total_revenue) as total_revenue,
    AVG(ca.total_revenue) as avg_revenue_per_customer,
    (COUNT(*) * 100.0 / NULLIF(total_customers, 0)) as percentage_of_customers,
    (SUM(ca.total_revenue) * 100.0 / NULLIF(total_revenue, 0)) as percentage_of_revenue
  FROM public.customer_analytics ca
  WHERE ca.vendor_id = p_vendor_id
    AND ca.total_revenue < (
      SELECT PERCENTILE_CONT(0.2) WITHIN GROUP (ORDER BY total_revenue)
      FROM public.customer_analytics
      WHERE vendor_id = p_vendor_id
    );
END;
$$;

-- Business Health Metrics
CREATE OR REPLACE FUNCTION public.get_business_health_metrics(
  p_vendor_id UUID,
  p_period_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  metric_name TEXT,
  current_value NUMERIC,
  previous_value NUMERIC,
  change_percentage NUMERIC,
  trend TEXT,
  benchmark TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_start DATE := CURRENT_DATE - (p_period_months || ' months')::INTERVAL;
  previous_start DATE := current_start - (p_period_months || ' months')::INTERVAL;
  previous_end DATE := current_start - INTERVAL '1 day';
BEGIN
  -- Revenue Growth Rate
  RETURN QUERY
  WITH revenue_comparison AS (
    SELECT 
      SUM(CASE WHEN i.created_at >= current_start THEN i.total ELSE 0 END) as current_revenue,
      SUM(CASE WHEN i.created_at >= previous_start AND i.created_at <= previous_end THEN i.total ELSE 0 END) as previous_revenue
    FROM public.invoices i
    WHERE i.vendor_id = p_vendor_id
  )
  SELECT 
    'Revenue Growth Rate'::TEXT,
    rc.current_revenue,
    rc.previous_revenue,
    CASE 
      WHEN rc.previous_revenue > 0 THEN 
        ((rc.current_revenue - rc.previous_revenue) / rc.previous_revenue) * 100
      ELSE NULL
    END as change_percentage,
    CASE 
      WHEN rc.current_revenue > rc.previous_revenue THEN 'up'
      WHEN rc.current_revenue < rc.previous_revenue THEN 'down'
      ELSE 'stable'
    END as trend,
    'Healthy: >10% annually'::TEXT as benchmark
  FROM revenue_comparison rc;
  
  -- Customer Acquisition Rate
  RETURN QUERY
  WITH customer_comparison AS (
    SELECT 
      COUNT(DISTINCT CASE WHEN i.created_at >= current_start THEN i.customer_id END) as current_customers,
      COUNT(DISTINCT CASE WHEN i.created_at >= previous_start AND i.created_at <= previous_end THEN i.customer_id END) as previous_customers
    FROM public.invoices i
    WHERE i.vendor_id = p_vendor_id
  )
  SELECT 
    'Active Customer Growth'::TEXT,
    cc.current_customers::NUMERIC,
    cc.previous_customers::NUMERIC,
    CASE 
      WHEN cc.previous_customers > 0 THEN 
        ((cc.current_customers - cc.previous_customers)::NUMERIC / cc.previous_customers) * 100
      ELSE NULL
    END as change_percentage,
    CASE 
      WHEN cc.current_customers > cc.previous_customers THEN 'up'
      WHEN cc.current_customers < cc.previous_customers THEN 'down'
      ELSE 'stable'
    END as trend,
    'Healthy: >5% quarterly'::TEXT as benchmark
  FROM customer_comparison cc;
  
  -- Average Invoice Value
  RETURN QUERY
  WITH invoice_value_comparison AS (
    SELECT 
      AVG(CASE WHEN i.created_at >= current_start THEN i.total END) as current_avg,
      AVG(CASE WHEN i.created_at >= previous_start AND i.created_at <= previous_end THEN i.total END) as previous_avg
    FROM public.invoices i
    WHERE i.vendor_id = p_vendor_id
  )
  SELECT 
    'Average Invoice Value'::TEXT,
    ivc.current_avg,
    ivc.previous_avg,
    CASE 
      WHEN ivc.previous_avg > 0 THEN 
        ((ivc.current_avg - ivc.previous_avg) / ivc.previous_avg) * 100
      ELSE NULL
    END as change_percentage,
    CASE 
      WHEN ivc.current_avg > ivc.previous_avg THEN 'up'
      WHEN ivc.current_avg < ivc.previous_avg THEN 'down'
      ELSE 'stable'
    END as trend,
    'Track trends over time'::TEXT as benchmark
  FROM invoice_value_comparison ivc;
  
  -- Payment Collection Rate
  RETURN QUERY
  WITH collection_comparison AS (
    SELECT 
      (SUM(CASE WHEN i.created_at >= current_start AND i.status = 'paid' THEN i.total ELSE 0 END) / 
       NULLIF(SUM(CASE WHEN i.created_at >= current_start THEN i.total END), 0)) * 100 as current_rate,
      (SUM(CASE WHEN i.created_at >= previous_start AND i.created_at <= previous_end AND i.status = 'paid' THEN i.total ELSE 0 END) / 
       NULLIF(SUM(CASE WHEN i.created_at >= previous_start AND i.created_at <= previous_end THEN i.total END), 0)) * 100 as previous_rate
    FROM public.invoices i
    WHERE i.vendor_id = p_vendor_id
  )
  SELECT 
    'Payment Collection Rate'::TEXT,
    cc.current_rate,
    cc.previous_rate,
    cc.current_rate - cc.previous_rate as change_percentage,
    CASE 
      WHEN cc.current_rate > cc.previous_rate THEN 'up'
      WHEN cc.current_rate < cc.previous_rate THEN 'down'
      ELSE 'stable'
    END as trend,
    'Target: >95%'::TEXT as benchmark
  FROM collection_comparison cc;
END;
$$;

-- =====================================================
-- 3. REFRESH MATERIALIZED VIEWS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time TIMESTAMP := clock_timestamp();
  end_time TIMESTAMP;
BEGIN
  -- Refresh all materialized views
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_revenue_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.monthly_revenue_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.customer_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.expense_analytics;
  
  end_time := clock_timestamp();
  
  RETURN 'Analytics views refreshed successfully in ' || 
         EXTRACT(milliseconds FROM end_time - start_time) || 'ms';
END;
$$;

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on materialized views
ALTER MATERIALIZED VIEW public.daily_revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW public.monthly_revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW public.customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW public.expense_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics views
CREATE POLICY "analytics_vendor_access" ON public.daily_revenue_analytics
  FOR SELECT USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "analytics_vendor_access" ON public.monthly_revenue_analytics
  FOR SELECT USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "analytics_vendor_access" ON public.customer_analytics
  FOR SELECT USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "analytics_vendor_access" ON public.product_analytics
  FOR SELECT USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "analytics_vendor_access" ON public.expense_analytics
  FOR SELECT USING (vendor_id = public.get_user_vendor_id());

-- =====================================================
-- 5. SCHEDULED REFRESH (CRON JOB)
-- =====================================================

-- Create a function to schedule analytics refresh
SELECT cron.schedule('refresh-analytics', '0 2 * * *', 'SELECT public.refresh_analytics_views();');

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.daily_revenue_analytics TO authenticated;
GRANT SELECT ON public.monthly_revenue_analytics TO authenticated;
GRANT SELECT ON public.customer_analytics TO authenticated;
GRANT SELECT ON public.product_analytics TO authenticated;
GRANT SELECT ON public.expense_analytics TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_revenue_trends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_segmentation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_health_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_views TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Advanced Analytics Dashboard created successfully!';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '- Materialized views for fast analytics queries';
  RAISE NOTICE '- Revenue trend analysis with growth rates';
  RAISE NOTICE '- Customer segmentation and lifetime value';
  RAISE NOTICE '- Product performance tracking';
  RAISE NOTICE '- Business health metrics and benchmarks';
  RAISE NOTICE '- Automated daily refresh of analytics data';
  RAISE NOTICE '- Row-level security for multi-tenant access';
END
$$;