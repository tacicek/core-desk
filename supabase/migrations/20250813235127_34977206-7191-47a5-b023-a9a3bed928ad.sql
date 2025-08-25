-- Create multi-vendor architecture

-- Create vendors table for multi-tenant support
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT,
  address JSONB,
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS for vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create user profiles table with vendor association
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Add vendor_id to existing tables for multi-tenancy
ALTER TABLE public.customers ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;
ALTER TABLE public.offers ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;
ALTER TABLE public.company_settings ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_vendor_id ON public.user_profiles(vendor_id);
CREATE INDEX idx_customers_vendor_id ON public.customers(vendor_id);
CREATE INDEX idx_invoices_vendor_id ON public.invoices(vendor_id);
CREATE INDEX idx_offers_vendor_id ON public.offers(vendor_id);
CREATE INDEX idx_company_settings_vendor_id ON public.company_settings(vendor_id);

-- Create function to get user's vendor
CREATE OR REPLACE FUNCTION public.get_user_vendor_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT vendor_id FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Create function to check if user owns vendor
CREATE OR REPLACE FUNCTION public.is_vendor_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_owner FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Create trigger for updating vendor updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for vendors table
CREATE POLICY "Users can view their own vendor" 
  ON public.vendors 
  FOR SELECT 
  USING (id = public.get_user_vendor_id());

CREATE POLICY "Vendor owners can update their vendor" 
  ON public.vendors 
  FOR UPDATE 
  USING (id = public.get_user_vendor_id() AND public.is_vendor_owner());

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Update existing RLS policies to be vendor-aware
DROP POLICY IF EXISTS "customers_owner_select" ON public.customers;
DROP POLICY IF EXISTS "customers_owner_modify" ON public.customers;

CREATE POLICY "customers_vendor_select" 
  ON public.customers 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "customers_vendor_modify" 
  ON public.customers 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Update invoices policies
DROP POLICY IF EXISTS "invoices_owner_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_owner_modify" ON public.invoices;

CREATE POLICY "invoices_vendor_select" 
  ON public.invoices 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "invoices_vendor_modify" 
  ON public.invoices 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Update offers policies  
DROP POLICY IF EXISTS "offers_owner_select" ON public.offers;
DROP POLICY IF EXISTS "offers_owner_modify" ON public.offers;

CREATE POLICY "offers_vendor_select" 
  ON public.offers 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "offers_vendor_modify" 
  ON public.offers 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Update company_settings policies
DROP POLICY IF EXISTS "company_settings_owner_select" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_owner_modify" ON public.company_settings;

CREATE POLICY "company_settings_vendor_select" 
  ON public.company_settings 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "company_settings_vendor_modify" 
  ON public.company_settings 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Update invoice_items and offer_items policies to be vendor-aware through parent tables
DROP POLICY IF EXISTS "items_owner_select" ON public.invoice_items;
DROP POLICY IF EXISTS "items_owner_modify" ON public.invoice_items;

CREATE POLICY "invoice_items_vendor_select" 
  ON public.invoice_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.vendor_id = public.get_user_vendor_id()
    )
  );

CREATE POLICY "invoice_items_vendor_modify" 
  ON public.invoice_items 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.vendor_id = public.get_user_vendor_id()
    )
  );

DROP POLICY IF EXISTS "offer_items_owner_select" ON public.offer_items;
DROP POLICY IF EXISTS "offer_items_owner_modify" ON public.offer_items;

CREATE POLICY "offer_items_vendor_select" 
  ON public.offer_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.offers 
      WHERE offers.id = offer_items.offer_id 
      AND offers.vendor_id = public.get_user_vendor_id()
    )
  );

CREATE POLICY "offer_items_vendor_modify" 
  ON public.offer_items 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.offers 
      WHERE offers.id = offer_items.offer_id 
      AND offers.vendor_id = public.get_user_vendor_id()
    )
  );