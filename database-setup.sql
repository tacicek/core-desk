-- =====================================================
-- COZY INVOICE SYSTEM - COMPLETE DATABASE SETUP
-- =====================================================
-- This script sets up the complete database schema for your Coolify-hosted Supabase instance
-- Run this script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CORE UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- =====================================================
-- 2. VENDORS TABLE (Multi-tenant support)
-- =====================================================

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

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. USER PROFILES TABLE
-- =====================================================

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

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. COMPANY SETTINGS TABLE
-- =====================================================

CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Switzerland',
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_number TEXT,
  bank_name TEXT,
  iban TEXT,
  bic TEXT,
  logo_url TEXT,
  invoice_terms TEXT,
  invoice_footer TEXT,
  contact_person TEXT,
  contact_position TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CUSTOMERS TABLE
-- =====================================================

CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Switzerland',
  tax_number TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. PRODUCTS TABLE
-- =====================================================

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 8.1,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. INVOICES TABLE
-- =====================================================

CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Entwurf' CHECK (status IN ('Entwurf', 'Offen', 'Bezahlt', 'Überfällig', 'Storniert')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CHF',
  notes TEXT,
  terms TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, invoice_number)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. INVOICE ITEMS TABLE
-- =====================================================

CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 8.1,
  line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. OFFERS TABLE
-- =====================================================

CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  offer_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Entwurf' CHECK (status IN ('Entwurf', 'Gesendet', 'Akzeptiert', 'Abgelehnt', 'Abgelaufen')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CHF',
  notes TEXT,
  terms TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, offer_number)
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. OFFER ITEMS TABLE
-- =====================================================

CREATE TABLE public.offer_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 8.1,
  line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. BUSINESS EXPENSES TABLE
-- =====================================================

CREATE TABLE public.business_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 8.1,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expense_type TEXT NOT NULL,
  tax_category TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. REVENUE TABLE
-- =====================================================

CREATE TABLE public.revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CHF',
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 13. TAX CATEGORIES TABLE
-- =====================================================

CREATE TABLE public.tax_categories (
  id TEXT NOT NULL PRIMARY KEY,
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Insert default tax categories
INSERT INTO public.tax_categories (id, name_de, name_en, description) VALUES
('office', 'Büroausstattung', 'Office Equipment', 'Office furniture, equipment, and supplies'),
('marketing', 'Marketing & Werbung', 'Marketing & Advertising', 'Marketing materials, advertising, promotions'),
('travel', 'Reisekosten', 'Travel Expenses', 'Business travel, accommodation, meals'),
('training', 'Weiterbildung', 'Training & Education', 'Professional development, courses, training'),
('software', 'Software & IT', 'Software & IT', 'Software licenses, IT services, hardware'),
('utilities', 'Betriebskosten', 'Operating Expenses', 'Utilities, rent, insurance'),
('other', 'Sonstige', 'Other', 'Other business expenses');

-- =====================================================
-- 14. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_vendor_id ON public.user_profiles(vendor_id);
CREATE INDEX idx_customers_vendor_id ON public.customers(vendor_id);
CREATE INDEX idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX idx_invoices_vendor_id ON public.invoices(vendor_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_offers_vendor_id ON public.offers(vendor_id);
CREATE INDEX idx_offer_items_offer_id ON public.offer_items(offer_id);
CREATE INDEX idx_business_expenses_vendor_id ON public.business_expenses(vendor_id);
CREATE INDEX idx_revenue_vendor_id ON public.revenue(vendor_id);
CREATE INDEX idx_company_settings_vendor_id ON public.company_settings(vendor_id);

-- =====================================================
-- 15. UTILITY FUNCTIONS
-- =====================================================

-- Function to get user's vendor
CREATE OR REPLACE FUNCTION public.get_user_vendor_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT vendor_id FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- Function to check if user owns vendor
CREATE OR REPLACE FUNCTION public.is_vendor_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_owner FROM public.user_profiles WHERE user_id = auth.uid();
$$;

-- =====================================================
-- 16. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at
  BEFORE UPDATE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_items_updated_at
  BEFORE UPDATE ON public.offer_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_expenses_updated_at
  BEFORE UPDATE ON public.business_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenue_updated_at
  BEFORE UPDATE ON public.revenue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 17. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Vendors policies
CREATE POLICY "Users can view their own vendor" 
  ON public.vendors 
  FOR SELECT 
  USING (id = public.get_user_vendor_id());

CREATE POLICY "Vendor owners can update their vendor" 
  ON public.vendors 
  FOR UPDATE 
  USING (id = public.get_user_vendor_id() AND public.is_vendor_owner());

-- User profiles policies
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

-- Company settings policies
CREATE POLICY "company_settings_vendor_select" 
  ON public.company_settings 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "company_settings_vendor_modify" 
  ON public.company_settings 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Customers policies
CREATE POLICY "customers_vendor_select" 
  ON public.customers 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "customers_vendor_modify" 
  ON public.customers 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Products policies
CREATE POLICY "products_vendor_select" 
  ON public.products 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "products_vendor_modify" 
  ON public.products 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Invoices policies
CREATE POLICY "invoices_vendor_select" 
  ON public.invoices 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "invoices_vendor_modify" 
  ON public.invoices 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Invoice items policies
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

-- Offers policies  
CREATE POLICY "offers_vendor_select" 
  ON public.offers 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "offers_vendor_modify" 
  ON public.offers 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Offer items policies
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

-- Business expenses policies
CREATE POLICY "business_expenses_vendor_select" 
  ON public.business_expenses 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "business_expenses_vendor_modify" 
  ON public.business_expenses 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- Revenue policies
CREATE POLICY "revenue_vendor_select" 
  ON public.revenue 
  FOR SELECT 
  USING (vendor_id = public.get_user_vendor_id());

CREATE POLICY "revenue_vendor_modify" 
  ON public.revenue 
  FOR ALL 
  USING (vendor_id = public.get_user_vendor_id());

-- =====================================================
-- 18. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_vendor_id() TO anon;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- 
-- Next steps:
-- 1. Run this script in your Supabase SQL Editor
-- 2. Set up authentication in Supabase Dashboard
-- 3. Configure environment variables in Coolify
-- 4. Deploy your application
--
-- The database is now ready for the Cozy Invoice system!