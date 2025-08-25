-- Create endpoint for n8n webhook integration
CREATE OR REPLACE FUNCTION public.create_invoice_from_webhook(
  p_vendor_id uuid,
  p_vendor_name text,
  p_invoice_number text,
  p_invoice_date date,
  p_due_date date,
  p_amount numeric,
  p_currency text DEFAULT 'CHF',
  p_description text DEFAULT '',
  p_category text DEFAULT 'other'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  new_invoice_id uuid;
BEGIN
  INSERT INTO public.incoming_invoices (
    vendor_id,
    vendor_name,
    invoice_number,
    invoice_date,
    due_date,
    amount,
    currency,
    description,
    category,
    status,
    needs_review,
    ai_confidence,
    created_by
  )
  VALUES (
    p_vendor_id,
    p_vendor_name,
    p_invoice_number,
    p_invoice_date,
    p_due_date,
    p_amount,
    p_currency,
    p_description,
    p_category,
    'pending',
    false,
    1.0,
    auth.uid()
  )
  RETURNING id INTO new_invoice_id;
  
  RETURN new_invoice_id;
END;
$$;