-- Create incoming_invoices table for tracking bills received from vendors
CREATE TABLE public.incoming_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  created_by UUID NOT NULL,
  
  -- Invoice details extracted from OCR
  vendor_name TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CHF',
  
  -- Additional details
  description TEXT,
  category TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  
  -- File storage
  image_url TEXT,
  original_filename TEXT,
  
  -- AI processing
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  needs_review BOOLEAN DEFAULT false,
  
  -- Reminder settings
  reminder_sent BOOLEAN DEFAULT false,
  reminder_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incoming_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor isolation
CREATE POLICY "incoming_invoices_vendor_select" 
ON public.incoming_invoices 
FOR SELECT 
USING (vendor_id = get_user_vendor_id());

CREATE POLICY "incoming_invoices_vendor_modify" 
ON public.incoming_invoices 
FOR ALL 
USING (vendor_id = get_user_vendor_id());

-- Create storage bucket for invoice images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoice-uploads', 'invoice-uploads', false);

-- Create storage policies for invoice images
CREATE POLICY "Users can view their vendor's invoice images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'invoice-uploads' AND 
  EXISTS (
    SELECT 1 FROM public.incoming_invoices 
    WHERE image_url LIKE '%' || name AND vendor_id = get_user_vendor_id()
  )
);

CREATE POLICY "Users can upload invoice images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'invoice-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their invoice images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'invoice-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create index for performance
CREATE INDEX idx_incoming_invoices_vendor_id ON public.incoming_invoices(vendor_id);
CREATE INDEX idx_incoming_invoices_due_date ON public.incoming_invoices(due_date);
CREATE INDEX idx_incoming_invoices_status ON public.incoming_invoices(status);

-- Create trigger for updated_at
CREATE TRIGGER update_incoming_invoices_updated_at
  BEFORE UPDATE ON public.incoming_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();