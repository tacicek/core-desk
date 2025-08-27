-- Create company_settings table
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_number TEXT,
  qr_iban TEXT,
  bank_name TEXT,
  logo TEXT,
  invoice_number_format TEXT DEFAULT 'F-{YYYY}-{MM}-{###}',
  default_due_days INTEGER DEFAULT 30,
  default_tax_rate NUMERIC DEFAULT 8.1,
  sender_email TEXT,
  sender_name TEXT,
  email_subject_template TEXT,
  email_body_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for company_settings
CREATE POLICY "company_settings_owner_select" 
ON public.company_settings 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "company_settings_owner_modify" 
ON public.company_settings 
FOR ALL 
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();