-- Real-time Notifications System Migration
-- This migration creates comprehensive notification infrastructure

-- =====================================================
-- 1. NOTIFICATION TYPES ENUM
-- =====================================================

CREATE TYPE public.notification_type AS ENUM (
  'invoice_created',
  'invoice_sent',
  'invoice_paid',
  'invoice_overdue',
  'expense_added',
  'customer_added',
  'product_added',
  'revenue_milestone',
  'system_update',
  'security_alert',
  'api_key_expiry',
  'backup_completed',
  'payment_received',
  'subscription_expiry'
);

CREATE TYPE public.notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE public.notification_status AS ENUM (
  'unread',
  'read',
  'archived',
  'dismissed'
);

-- =====================================================
-- 2. NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  priority public.notification_priority NOT NULL DEFAULT 'medium',
  status public.notification_status NOT NULL DEFAULT 'unread',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  action_url TEXT,
  action_label TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_notifications_vendor_id ON public.notifications(vendor_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_priority ON public.notifications(priority);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  in_app BOOLEAN NOT NULL DEFAULT true,
  email BOOLEAN NOT NULL DEFAULT false,
  push BOOLEAN NOT NULL DEFAULT false,
  frequency TEXT DEFAULT 'instant', -- instant, daily, weekly
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, user_id, type)
);

CREATE INDEX idx_notification_preferences_vendor ON public.notification_preferences(vendor_id);
CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);

-- =====================================================
-- 4. NOTIFICATION TEMPLATES TABLE
-- =====================================================

CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.notification_type NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  default_priority public.notification_priority NOT NULL DEFAULT 'medium',
  default_action_label TEXT,
  variables JSONB DEFAULT '[]', -- Array of variable names used in templates
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. REAL-TIME NOTIFICATION CHANNELS
-- =====================================================

CREATE TABLE public.notification_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL, -- 'realtime', 'email', 'webhook'
  endpoint TEXT, -- WebSocket endpoint, email address, webhook URL
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_channels_vendor ON public.notification_channels(vendor_id);
CREATE INDEX idx_notification_channels_user ON public.notification_channels(user_id);
CREATE INDEX idx_notification_channels_type ON public.notification_channels(channel_type);

-- =====================================================
-- 6. NOTIFICATION DELIVERY LOG
-- =====================================================

CREATE TABLE public.notification_delivery_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.notification_channels(id) ON DELETE SET NULL,
  delivery_method TEXT NOT NULL, -- 'in_app', 'email', 'push', 'webhook'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_log_notification ON public.notification_delivery_log(notification_id);
CREATE INDEX idx_delivery_log_status ON public.notification_delivery_log(status);
CREATE INDEX idx_delivery_log_method ON public.notification_delivery_log(delivery_method);

-- =====================================================
-- 7. FUNCTIONS FOR NOTIFICATION MANAGEMENT
-- =====================================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_vendor_id UUID,
  p_user_id UUID,
  p_type public.notification_type,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_priority public.notification_priority DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Insert notification
  INSERT INTO public.notifications (
    vendor_id,
    user_id,
    type,
    title,
    message,
    metadata,
    priority,
    action_url,
    action_label,
    expires_at
  ) VALUES (
    p_vendor_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_metadata,
    p_priority,
    p_action_url,
    p_action_label,
    p_expires_at
  ) RETURNING id INTO notification_id;
  
  -- Trigger real-time notification
  PERFORM pg_notify(
    'notification_' || p_vendor_id::text,
    json_build_object(
      'id', notification_id,
      'type', p_type,
      'title', p_title,
      'message', p_message,
      'priority', p_priority,
      'metadata', p_metadata
    )::text
  );
  
  RETURN notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET 
    status = 'read',
    read_at = now(),
    updated_at = now()
  WHERE id = p_notification_id
    AND (user_id = p_user_id OR user_id IS NULL)
    AND status = 'unread';
    
  RETURN FOUND;
END;
$$;

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION public.get_notification_stats(
  p_vendor_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_count BIGINT,
  unread_count BIGINT,
  high_priority_count BIGINT,
  critical_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'unread') as unread_count,
    COUNT(*) FILTER (WHERE priority = 'high' AND status = 'unread') as high_priority_count,
    COUNT(*) FILTER (WHERE priority = 'critical' AND status = 'unread') as critical_count
  FROM public.notifications
  WHERE vendor_id = p_vendor_id
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL)
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired notifications
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL 
    AND expires_at < now();
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete old read notifications (older than 30 days)
  DELETE FROM public.notifications
  WHERE status = 'read'
    AND read_at < now() - INTERVAL '30 days';
    
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- 8. DEFAULT NOTIFICATION TEMPLATES
-- =====================================================

INSERT INTO public.notification_templates (type, title_template, message_template, default_priority, default_action_label, variables) VALUES
('invoice_created', 'New Invoice Created', 'Invoice {{invoice_number}} has been created for {{customer_name}}', 'low', 'View Invoice', '["invoice_number", "customer_name", "amount"]'),
('invoice_sent', 'Invoice Sent', 'Invoice {{invoice_number}} has been sent to {{customer_name}}', 'medium', 'View Invoice', '["invoice_number", "customer_name"]'),
('invoice_paid', 'Payment Received', 'Invoice {{invoice_number}} has been paid by {{customer_name}}', 'high', 'View Invoice', '["invoice_number", "customer_name", "amount"]'),
('invoice_overdue', 'Invoice Overdue', 'Invoice {{invoice_number}} is now overdue ({{days_overdue}} days)', 'high', 'Send Reminder', '["invoice_number", "customer_name", "days_overdue", "amount"]'),
('expense_added', 'New Expense Added', 'Expense of {{amount}} has been added for {{category}}', 'low', 'View Expense', '["amount", "category", "vendor_name"]'),
('customer_added', 'New Customer Added', 'Customer {{customer_name}} has been added to your database', 'low', 'View Customer', '["customer_name"]'),
('product_added', 'New Product Added', 'Product {{product_name}} has been added to your catalog', 'low', 'View Product', '["product_name", "price"]'),
('revenue_milestone', 'Revenue Milestone', 'Congratulations! You''ve reached {{amount}} in revenue', 'high', 'View Dashboard', '["amount", "period"]'),
('system_update', 'System Update', 'System has been updated with new features and improvements', 'medium', 'Learn More', '["version", "features"]'),
('security_alert', 'Security Alert', 'Unusual activity detected on your account', 'critical', 'Review Activity', '["activity_type", "timestamp"]'),
('api_key_expiry', 'API Key Expiring', 'Your {{service}} API key will expire in {{days}} days', 'high', 'Renew Key', '["service", "days"]'),
('backup_completed', 'Backup Completed', 'Your data backup has been completed successfully', 'low', NULL, '["backup_size", "timestamp"]'),
('payment_received', 'Payment Received', 'Payment of {{amount}} received from {{customer_name}}', 'medium', 'View Transaction', '["amount", "customer_name", "method"]'),
('subscription_expiry', 'Subscription Expiring', 'Your subscription will expire in {{days}} days', 'critical', 'Renew Subscription', '["days", "plan"]);

-- =====================================================
-- 9. DEFAULT NOTIFICATION PREFERENCES
-- =====================================================

-- Function to create default preferences for a new user
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences(
  p_vendor_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_preferences (vendor_id, user_id, type, enabled, in_app, email, push)
  SELECT 
    p_vendor_id,
    p_user_id,
    type,
    true, -- enabled
    true, -- in_app
    CASE 
      WHEN type IN ('invoice_paid', 'payment_received', 'security_alert', 'api_key_expiry', 'subscription_expiry') THEN true
      ELSE false
    END, -- email
    CASE 
      WHEN type IN ('security_alert', 'subscription_expiry') THEN true
      ELSE false
    END -- push
  FROM unnest(enum_range(NULL::public.notification_type)) AS type
  ON CONFLICT (vendor_id, user_id, type) DO NOTHING;
END;
$$;

-- =====================================================
-- 10. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all notification tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "notifications_vendor_select" ON public.notifications
  FOR SELECT USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "notifications_vendor_modify" ON public.notifications
  FOR ALL USING (vendor_id = public.get_user_vendor_id());

-- Notification preferences policies
CREATE POLICY "preferences_vendor_select" ON public.notification_preferences
  FOR SELECT USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "preferences_vendor_modify" ON public.notification_preferences
  FOR ALL USING (vendor_id = public.get_user_vendor_id());

-- Notification templates policies (read-only for users)
CREATE POLICY "templates_read_all" ON public.notification_templates
  FOR SELECT USING (true);

-- Notification channels policies
CREATE POLICY "channels_vendor_select" ON public.notification_channels
  FOR SELECT USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "channels_vendor_modify" ON public.notification_channels
  FOR ALL USING (vendor_id = public.get_user_vendor_id());

-- Delivery log policies
CREATE POLICY "delivery_log_vendor_select" ON public.notification_delivery_log
  FOR SELECT USING (
    notification_id IN (
      SELECT id FROM public.notifications WHERE vendor_id = public.get_user_vendor_id()
    )
  );

-- =====================================================
-- 11. TRIGGERS
-- =====================================================

-- Trigger to update timestamps
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON public.notification_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 12. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT SELECT ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_channels TO authenticated;
GRANT SELECT ON public.notification_delivery_log TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_notifications TO service_role;
GRANT EXECUTE ON FUNCTION public.create_default_notification_preferences TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Real-time notifications system created successfully!';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '- Comprehensive notification types and priorities';
  RAISE NOTICE '- User preferences and quiet hours';
  RAISE NOTICE '- Real-time delivery via pg_notify';
  RAISE NOTICE '- Email and push notification support';
  RAISE NOTICE '- Automatic cleanup of expired notifications';
  RAISE NOTICE '- Full audit trail and delivery tracking';
END
$$;