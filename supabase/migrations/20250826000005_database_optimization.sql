-- Database Performance Optimization Migration
-- This migration adds parallel execution, advanced caching, and performance improvements

-- =====================================================
-- 1. PERFORMANCE MONITORING TABLES
-- =====================================================

CREATE TABLE public.query_performance_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_name TEXT NOT NULL,
  execution_time_ms NUMERIC NOT NULL,
  rows_affected INTEGER,
  vendor_id UUID,
  user_id UUID,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  query_hash TEXT,
  parameters JSONB,
  error_message TEXT
);

CREATE INDEX idx_query_performance_log_query_name ON public.query_performance_log(query_name);
CREATE INDEX idx_query_performance_log_executed_at ON public.query_performance_log(executed_at DESC);
CREATE INDEX idx_query_performance_log_execution_time ON public.query_performance_log(execution_time_ms DESC);

-- =====================================================
-- 2. ADVANCED CACHING SYSTEM
-- =====================================================

CREATE TABLE public.query_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  vendor_id UUID NOT NULL,
  query_name TEXT NOT NULL,
  result_data JSONB NOT NULL,
  parameters_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_size INTEGER DEFAULT 0
);

CREATE INDEX idx_query_cache_key ON public.query_cache(cache_key);
CREATE INDEX idx_query_cache_vendor ON public.query_cache(vendor_id);
CREATE INDEX idx_query_cache_expires ON public.query_cache(expires_at);
CREATE INDEX idx_query_cache_accessed ON public.query_cache(last_accessed);

-- =====================================================
-- 3. PARALLEL EXECUTION FUNCTIONS
-- =====================================================

-- Parallel Dashboard Data Fetcher
CREATE OR REPLACE FUNCTION public.get_dashboard_data_parallel(
  p_vendor_id UUID
)
RETURNS TABLE (
  section TEXT,
  data JSONB,
  execution_time_ms NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
PARALLEL SAFE
AS $$
DECLARE
  start_time TIMESTAMP := clock_timestamp();
  end_time TIMESTAMP;
BEGIN
  -- Invoice statistics
  RETURN QUERY
  WITH invoice_stats AS (
    SELECT 
      COUNT(*) as total_invoices,
      COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
      COUNT(*) FILTER (WHERE status = 'sent') as sent_invoices,
      COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices,
      COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as paid_revenue,
      COALESCE(AVG(total), 0) as avg_invoice_value
    FROM public.invoices
    WHERE vendor_id = p_vendor_id
      AND created_at >= CURRENT_DATE - INTERVAL '12 months'
  )
  SELECT 
    'invoice_stats'::TEXT,
    to_jsonb(invoice_stats.*),
    EXTRACT(milliseconds FROM clock_timestamp() - start_time)
  FROM invoice_stats;

  -- Customer statistics
  start_time := clock_timestamp();
  RETURN QUERY
  WITH customer_stats AS (
    SELECT 
      COUNT(DISTINCT c.id) as total_customers,
      COUNT(DISTINCT i.customer_id) FILTER (WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days') as active_customers,
      COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days') as new_customers
    FROM public.customers c
    LEFT JOIN public.invoices i ON c.id = i.customer_id
    WHERE c.vendor_id = p_vendor_id
  )
  SELECT 
    'customer_stats'::TEXT,
    to_jsonb(customer_stats.*),
    EXTRACT(milliseconds FROM clock_timestamp() - start_time)
  FROM customer_stats;

  -- Recent activity
  start_time := clock_timestamp();
  RETURN QUERY
  WITH recent_activity AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', 'invoice',
        'id', id,
        'description', 'Invoice ' || invoice_no || ' - ' || (SELECT name FROM customers WHERE id = customer_id),
        'amount', total,
        'date', created_at,
        'status', status
      ) ORDER BY created_at DESC
    ) as activities
    FROM public.invoices
    WHERE vendor_id = p_vendor_id
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    LIMIT 10
  )
  SELECT 
    'recent_activity'::TEXT,
    COALESCE(recent_activity.activities, '[]'::jsonb),
    EXTRACT(milliseconds FROM clock_timestamp() - start_time)
  FROM recent_activity;
END;
$$;

-- Parallel Customer Analytics
CREATE OR REPLACE FUNCTION public.get_customer_analytics_parallel(
  p_vendor_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  customer_data JSONB,
  execution_time_ms NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
PARALLEL SAFE
AS $$
DECLARE
  start_time TIMESTAMP := clock_timestamp();
BEGIN
  RETURN QUERY
  WITH customer_analytics AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'customer_id', c.id,
        'name', c.name,
        'email', c.email,
        'total_invoices', COALESCE(invoice_counts.total_invoices, 0),
        'total_revenue', COALESCE(invoice_totals.total_revenue, 0),
        'avg_invoice_value', COALESCE(invoice_totals.avg_invoice_value, 0),
        'last_invoice_date', invoice_dates.last_invoice_date,
        'status', CASE 
          WHEN invoice_dates.last_invoice_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'active'
          WHEN invoice_dates.last_invoice_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'inactive'
          ELSE 'dormant'
        END
      ) ORDER BY COALESCE(invoice_totals.total_revenue, 0) DESC
    ) as analytics_data
    FROM public.customers c
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as total_invoices
      FROM public.invoices i
      WHERE i.customer_id = c.id
    ) invoice_counts ON true
    LEFT JOIN LATERAL (
      SELECT 
        SUM(total) as total_revenue,
        AVG(total) as avg_invoice_value
      FROM public.invoices i
      WHERE i.customer_id = c.id
    ) invoice_totals ON true
    LEFT JOIN LATERAL (
      SELECT MAX(created_at) as last_invoice_date
      FROM public.invoices i
      WHERE i.customer_id = c.id
    ) invoice_dates ON true
    WHERE c.vendor_id = p_vendor_id
    LIMIT p_limit
  )
  SELECT 
    COALESCE(customer_analytics.analytics_data, '[]'::jsonb),
    EXTRACT(milliseconds FROM clock_timestamp() - start_time)
  FROM customer_analytics;
END;
$$;

-- =====================================================
-- 4. CACHED QUERY EXECUTION SYSTEM
-- =====================================================

-- Generic cached query executor
CREATE OR REPLACE FUNCTION public.execute_cached_query(
  p_vendor_id UUID,
  p_query_name TEXT,
  p_parameters JSONB DEFAULT '{}',
  p_cache_ttl_minutes INTEGER DEFAULT 30,
  p_force_refresh BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cache_key TEXT;
  parameters_hash TEXT;
  cached_result RECORD;
  fresh_result JSONB;
  start_time TIMESTAMP := clock_timestamp();
  execution_time NUMERIC;
BEGIN
  -- Generate cache key
  parameters_hash := encode(sha256(p_parameters::TEXT::bytea), 'hex');
  cache_key := p_vendor_id::TEXT || '_' || p_query_name || '_' || parameters_hash;
  
  -- Check cache first (unless force refresh)
  IF NOT p_force_refresh THEN
    SELECT result_data, created_at, expires_at
    INTO cached_result
    FROM public.query_cache
    WHERE cache_key = cache_key
      AND vendor_id = p_vendor_id
      AND expires_at > now();
    
    IF FOUND THEN
      -- Update hit count and last accessed
      UPDATE public.query_cache
      SET 
        hit_count = hit_count + 1,
        last_accessed = now()
      WHERE cache_key = cache_key;
      
      RETURN cached_result.result_data;
    END IF;
  END IF;
  
  -- Execute fresh query based on query name
  CASE p_query_name
    WHEN 'dashboard_data' THEN
      WITH dashboard_results AS (
        SELECT jsonb_object_agg(section, data) as result
        FROM public.get_dashboard_data_parallel(p_vendor_id)
      )
      SELECT result INTO fresh_result FROM dashboard_results;
      
    WHEN 'customer_analytics' THEN
      WITH customer_results AS (
        SELECT customer_data as result
        FROM public.get_customer_analytics_parallel(
          p_vendor_id, 
          COALESCE((p_parameters->>'limit')::INTEGER, 50)
        )
      )
      SELECT result INTO fresh_result FROM customer_results;
      
    WHEN 'revenue_trends' THEN
      WITH revenue_results AS (
        SELECT jsonb_agg(
          jsonb_build_object(
            'date', date,
            'revenue', total_revenue,
            'invoice_count', invoice_count
          ) ORDER BY date
        ) as result
        FROM public.daily_revenue_analytics
        WHERE vendor_id = p_vendor_id
          AND date >= (p_parameters->>'start_date')::DATE
          AND date <= (p_parameters->>'end_date')::DATE
      )
      SELECT COALESCE(result, '[]'::jsonb) INTO fresh_result FROM revenue_results;
      
    ELSE
      RAISE EXCEPTION 'Unknown query name: %', p_query_name;
  END CASE;
  
  execution_time := EXTRACT(milliseconds FROM clock_timestamp() - start_time);
  
  -- Cache the result
  INSERT INTO public.query_cache (
    cache_key,
    vendor_id,
    query_name,
    result_data,
    parameters_hash,
    expires_at,
    data_size
  ) VALUES (
    cache_key,
    p_vendor_id,
    p_query_name,
    fresh_result,
    parameters_hash,
    now() + (p_cache_ttl_minutes || ' minutes')::INTERVAL,
    octet_length(fresh_result::TEXT)
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    result_data = EXCLUDED.result_data,
    expires_at = EXCLUDED.expires_at,
    data_size = EXCLUDED.data_size,
    hit_count = 0,
    last_accessed = now();
  
  -- Log performance
  INSERT INTO public.query_performance_log (
    query_name,
    execution_time_ms,
    vendor_id,
    query_hash,
    parameters
  ) VALUES (
    p_query_name,
    execution_time,
    p_vendor_id,
    parameters_hash,
    p_parameters
  );
  
  RETURN fresh_result;
END;
$$;

-- =====================================================
-- 5. BULK OPERATIONS FOR PERFORMANCE
-- =====================================================

-- Bulk invoice creation
CREATE OR REPLACE FUNCTION public.bulk_create_invoices(
  p_vendor_id UUID,
  p_invoices JSONB
)
RETURNS TABLE (
  created_count INTEGER,
  failed_count INTEGER,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invoice_record JSONB;
  created_invoices INTEGER := 0;
  failed_invoices INTEGER := 0;
  error_list JSONB := '[]'::jsonb;
BEGIN
  -- Validate input
  IF NOT jsonb_typeof(p_invoices) = 'array' THEN
    RAISE EXCEPTION 'Input must be a JSON array';
  END IF;
  
  -- Process each invoice
  FOR invoice_record IN SELECT * FROM jsonb_array_elements(p_invoices)
  LOOP
    BEGIN
      INSERT INTO public.invoices (
        vendor_id,
        customer_id,
        invoice_no,
        issue_date,
        due_date,
        subtotal,
        tax_total,
        total,
        currency,
        status
      ) VALUES (
        p_vendor_id,
        (invoice_record->>'customer_id')::UUID,
        invoice_record->>'invoice_no',
        (invoice_record->>'issue_date')::DATE,
        (invoice_record->>'due_date')::DATE,
        (invoice_record->>'subtotal')::NUMERIC,
        (invoice_record->>'tax_total')::NUMERIC,
        (invoice_record->>'total')::NUMERIC,
        COALESCE(invoice_record->>'currency', 'CHF'),
        COALESCE(invoice_record->>'status', 'draft')
      );
      
      created_invoices := created_invoices + 1;
      
    EXCEPTION WHEN OTHERS THEN
      failed_invoices := failed_invoices + 1;
      error_list := error_list || jsonb_build_object(
        'invoice_no', invoice_record->>'invoice_no',
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN QUERY SELECT created_invoices, failed_invoices, error_list;
END;
$$;

-- =====================================================
-- 6. ADVANCED INDEXING STRATEGIES
-- =====================================================

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_vendor_status_date 
ON public.invoices (vendor_id, status, created_at DESC) 
WHERE status IN ('sent', 'paid', 'overdue');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_vendor_recent 
ON public.invoices (vendor_id, created_at DESC) 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_vendor_active 
ON public.customers (vendor_id, created_at DESC) 
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

-- Covering indexes for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_analytics_covering 
ON public.invoices (vendor_id, customer_id, status) 
INCLUDE (total, created_at, updated_at);

-- Expression indexes for common calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_month_year 
ON public.invoices (vendor_id, EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at));

-- =====================================================
-- 7. QUERY OPTIMIZATION VIEWS
-- =====================================================

-- Optimized recent invoices view
CREATE MATERIALIZED VIEW public.recent_invoices_optimized AS
SELECT 
  i.id,
  i.vendor_id,
  i.invoice_no,
  i.total,
  i.status,
  i.created_at,
  c.name as customer_name,
  c.email as customer_email
FROM public.invoices i
JOIN public.customers c ON i.customer_id = c.id
WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY i.created_at DESC;

CREATE UNIQUE INDEX idx_recent_invoices_optimized_id ON public.recent_invoices_optimized(id);
CREATE INDEX idx_recent_invoices_optimized_vendor ON public.recent_invoices_optimized(vendor_id);

-- =====================================================
-- 8. CACHE MAINTENANCE FUNCTIONS
-- =====================================================

-- Clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_query_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired entries
  DELETE FROM public.query_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete least recently used entries if cache is too large
  WITH cache_stats AS (
    SELECT COUNT(*) as total_entries,
           SUM(data_size) as total_size
    FROM public.query_cache
  ),
  entries_to_delete AS (
    SELECT id
    FROM public.query_cache
    WHERE (SELECT total_entries FROM cache_stats) > 1000
       OR (SELECT total_size FROM cache_stats) > 100 * 1024 * 1024 -- 100MB
    ORDER BY last_accessed ASC
    LIMIT GREATEST(
      (SELECT total_entries FROM cache_stats) - 800,
      0
    )
  )
  DELETE FROM public.query_cache
  WHERE id IN (SELECT id FROM entries_to_delete);
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- 9. PERFORMANCE MONITORING FUNCTIONS
-- =====================================================

-- Get query performance statistics
CREATE OR REPLACE FUNCTION public.get_query_performance_stats()
RETURNS TABLE (
  query_name TEXT,
  avg_execution_time_ms NUMERIC,
  max_execution_time_ms NUMERIC,
  total_executions BIGINT,
  error_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qpl.query_name,
    AVG(qpl.execution_time_ms) as avg_execution_time_ms,
    MAX(qpl.execution_time_ms) as max_execution_time_ms,
    COUNT(*) as total_executions,
    (COUNT(*) FILTER (WHERE qpl.error_message IS NOT NULL) * 100.0 / COUNT(*)) as error_rate
  FROM public.query_performance_log qpl
  WHERE qpl.executed_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY qpl.query_name
  ORDER BY avg_execution_time_ms DESC;
END;
$$;

-- =====================================================
-- 10. SCHEDULED MAINTENANCE
-- =====================================================

-- Schedule cache cleanup
SELECT cron.schedule('cleanup-query-cache', '0 3 * * *', 'SELECT public.cleanup_query_cache();');

-- Schedule analytics refresh with performance tracking
SELECT cron.schedule('refresh-analytics-performance', '0 2 * * *', $$
  DO $$
  DECLARE
    start_time TIMESTAMP := clock_timestamp();
    result TEXT;
  BEGIN
    SELECT public.refresh_analytics_views() INTO result;
    
    INSERT INTO public.query_performance_log (
      query_name,
      execution_time_ms,
      rows_affected
    ) VALUES (
      'refresh_analytics_views',
      EXTRACT(milliseconds FROM clock_timestamp() - start_time),
      1
    );
  END
  $$;
$$);

-- =====================================================
-- 11. ROW LEVEL SECURITY FOR NEW TABLES
-- =====================================================

ALTER TABLE public.query_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "performance_log_vendor_access" ON public.query_performance_log
  FOR ALL USING (vendor_id = public.get_user_vendor_id() OR vendor_id IS NULL);

CREATE POLICY "query_cache_vendor_access" ON public.query_cache
  FOR ALL USING (vendor_id = public.get_user_vendor_id());

-- =====================================================
-- 12. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.query_performance_log TO authenticated;
GRANT ALL ON public.query_cache TO authenticated;
GRANT SELECT ON public.recent_invoices_optimized TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_dashboard_data_parallel TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_analytics_parallel TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_cached_query TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_create_invoices TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_query_cache TO service_role;
GRANT EXECUTE ON FUNCTION public.get_query_performance_stats TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Database Performance Optimization completed successfully!';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '- Parallel execution functions for complex queries';
  RAISE NOTICE '- Advanced caching system with TTL and LRU eviction';
  RAISE NOTICE '- Bulk operations for improved throughput';
  RAISE NOTICE '- Performance monitoring and logging';
  RAISE NOTICE '- Optimized indexes and materialized views';
  RAISE NOTICE '- Automated cache cleanup and maintenance';
  RAISE NOTICE '- Query performance statistics and monitoring';
END
$$;