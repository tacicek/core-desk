-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  user_id UUID,
  type TEXT NOT NULL CHECK (type IN ('email', 'upload', 'invoice_due', 'payment', 'system', 'warning')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor access
CREATE POLICY "Users can view their vendor's notifications" 
ON public.notifications 
FOR SELECT 
USING (vendor_id = get_user_vendor_id());

CREATE POLICY "Users can update their vendor's notifications" 
ON public.notifications 
FOR UPDATE 
USING (vendor_id = get_user_vendor_id());

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_vendor_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_user_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    vendor_id, user_id, type, title, message, priority, action_url, metadata
  )
  VALUES (
    p_vendor_id, p_user_id, p_type, p_title, p_message, p_priority, p_action_url, p_metadata
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create triggers for automatic notifications

-- Trigger for overdue invoices
CREATE OR REPLACE FUNCTION public.check_overdue_invoices()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if invoice is now overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status = 'pending' AND OLD.status = 'pending' THEN
    PERFORM create_notification(
      NEW.vendor_id,
      'invoice_due',
      'Rechnung überfällig',
      'Rechnung ' || COALESCE(NEW.invoice_number, 'Nr. unbekannt') || ' von ' || 
      COALESCE(NEW.vendor_name, 'Unbekannter Anbieter') || ' ist überfällig (CHF ' || NEW.amount::text || ')',
      'high',
      NULL,
      '/dashboard/invoice-management'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_overdue_invoices
  AFTER UPDATE ON public.incoming_invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_overdue_invoices();

-- Trigger for successful uploads
CREATE OR REPLACE FUNCTION public.notify_upload_success()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM create_notification(
    NEW.vendor_id,
    'upload',
    'Upload erfolgreich',
    'Rechnung ' || COALESCE(NEW.original_filename, 'Datei') || ' wurde erfolgreich verarbeitet',
    'low',
    NEW.created_by,
    '/dashboard/invoice-management'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_upload_success
  AFTER INSERT ON public.incoming_invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_upload_success();

-- Trigger for payments
CREATE OR REPLACE FUNCTION public.notify_payment_received()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if status changed to paid
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    PERFORM create_notification(
      NEW.vendor_id,
      'payment',
      'Zahlung eingegangen',
      'Rechnung ' || COALESCE(NEW.invoice_number, 'Nr. unbekannt') || ' wurde bezahlt (CHF ' || NEW.amount::text || ')',
      'medium',
      NULL,
      '/dashboard/invoice-management'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_payment_received
  AFTER UPDATE ON public.incoming_invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();