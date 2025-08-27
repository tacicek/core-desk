-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  contact_gender TEXT CHECK (contact_gender IN ('male', 'female', 'neutral')),
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  tax_number TEXT,
  vendor_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor access
CREATE POLICY "customers_vendor_select" 
ON public.customers 
FOR SELECT 
USING (vendor_id = get_user_vendor_id());

CREATE POLICY "customers_vendor_modify" 
ON public.customers 
FOR ALL 
USING (vendor_id = get_user_vendor_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();