-- Add error logging and admin notification tables
-- This migration creates tables for comprehensive error tracking and admin notifications

-- Create error_logs table for comprehensive error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id TEXT UNIQUE NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  component_stack TEXT,
  user_agent TEXT,
  url TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}'::jsonb,
  error_type TEXT DEFAULT 'frontend',
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create admin_notifications table for critical error notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_logs_error_id ON public.error_logs(error_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_vendor_id ON public.error_logs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id ON public.admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON public.admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);

-- Enable Row Level Security
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs
-- Super admins can view all error logs
CREATE POLICY "Super admins can view all error logs" 
ON public.error_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Super admins can update error logs (mark as resolved)
CREATE POLICY "Super admins can update error logs" 
ON public.error_logs 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- System can insert error logs (service role)
CREATE POLICY "System can insert error logs" 
ON public.error_logs 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Users can view their own error logs
CREATE POLICY "Users can view their own error logs" 
ON public.error_logs 
FOR SELECT 
USING (user_id = auth.uid());

-- RLS Policies for admin_notifications
-- Users can view their own notifications
CREATE POLICY "Users can view their own admin notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own admin notifications" 
ON public.admin_notifications 
FOR UPDATE 
USING (user_id = auth.uid());

-- System can insert admin notifications (service role)
CREATE POLICY "System can insert admin notifications" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Super admins can manage all notifications
CREATE POLICY "Super admins can manage all admin notifications" 
ON public.admin_notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Function to automatically clean up old error logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < now() - INTERVAL '90 days'
  AND resolved = true;
  
  -- Keep unresolved critical errors for longer (180 days)
  DELETE FROM public.error_logs 
  WHERE created_at < now() - INTERVAL '180 days'
  AND severity = 'critical'
  AND resolved = false;
  
  -- Clean up all other old unresolved errors (30 days)
  DELETE FROM public.error_logs 
  WHERE created_at < now() - INTERVAL '30 days'
  AND severity != 'critical'
  AND resolved = false;
END;
$$;

-- Function to automatically clean up old admin notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_admin_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.admin_notifications 
  WHERE created_at < now() - INTERVAL '30 days'
  AND read = true;
  
  -- Keep unread critical notifications for longer (60 days)
  DELETE FROM public.admin_notifications 
  WHERE created_at < now() - INTERVAL '60 days'
  AND priority = 'critical'
  AND read = false;
END;
$$;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(
  start_date TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  total_errors BIGINT,
  critical_errors BIGINT,
  unresolved_errors BIGINT,
  error_rate NUMERIC,
  most_common_error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH error_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE severity = 'critical') as critical,
      COUNT(*) FILTER (WHERE resolved = false) as unresolved,
      COUNT(*) / EXTRACT(EPOCH FROM (end_date - start_date)) * 3600 as rate
    FROM public.error_logs
    WHERE created_at BETWEEN start_date AND end_date
  ),
  common_error AS (
    SELECT message
    FROM public.error_logs
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY message
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT 
    es.total,
    es.critical,
    es.unresolved,
    ROUND(es.rate, 2),
    ce.message
  FROM error_stats es
  CROSS JOIN common_error ce;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.error_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_notifications TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION cleanup_old_error_logs() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_admin_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION get_error_statistics(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.error_logs IS 'Comprehensive error logging for frontend and backend errors';
COMMENT ON TABLE public.admin_notifications IS 'Notifications for system administrators about critical issues';
COMMENT ON FUNCTION cleanup_old_error_logs() IS 'Automatically removes old resolved error logs to manage database size';
COMMENT ON FUNCTION cleanup_old_admin_notifications() IS 'Automatically removes old read notifications to manage database size';
COMMENT ON FUNCTION get_error_statistics(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Returns error statistics for a given time period';