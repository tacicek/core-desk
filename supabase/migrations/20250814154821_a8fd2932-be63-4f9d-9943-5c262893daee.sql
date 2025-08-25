-- Create comprehensive business expenses table for tax reporting
CREATE TABLE public.business_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL,
  created_by uuid NOT NULL,
  
  -- Expense basic info
  expense_type text NOT NULL DEFAULT 'purchase', -- 'incoming_invoice', 'purchase', 'receipt', 'other'
  vendor_name text,
  document_number text, -- invoice number, receipt number, etc
  expense_date date,
  due_date date, -- for invoices only
  
  -- Financial details
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'CHF',
  vat_amount numeric DEFAULT 0,
  vat_rate numeric DEFAULT 8.1,
  net_amount numeric GENERATED ALWAYS AS (amount - COALESCE(vat_amount, 0)) STORED,
  
  -- Tax categorization (Swiss tax categories)
  tax_category text NOT NULL DEFAULT 'operating_expenses',
  -- operating_expenses, office_supplies, travel, meals, vehicle, rent, 
  -- utilities, insurance, professional_services, marketing, equipment, etc.
  
  business_purpose text, -- Required for tax deduction justification
  description text,
  
  -- Payment tracking
  status text NOT NULL DEFAULT 'pending', -- pending, paid, overdue, cancelled
  payment_date date,
  payment_method text, -- cash, bank_transfer, credit_card, etc
  
  -- Document management
  image_url text,
  original_filename text,
  
  -- AI processing
  ai_confidence numeric DEFAULT 0,
  needs_review boolean DEFAULT true,
  
  -- Audit trail
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "business_expenses_vendor_select" 
ON public.business_expenses 
FOR SELECT 
USING (vendor_id = get_user_vendor_id());

CREATE POLICY "business_expenses_vendor_modify" 
ON public.business_expenses 
FOR ALL 
USING (vendor_id = get_user_vendor_id());

-- Add trigger for updated_at
CREATE TRIGGER update_business_expenses_updated_at
BEFORE UPDATE ON public.business_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_business_expenses_vendor_id ON public.business_expenses(vendor_id);
CREATE INDEX idx_business_expenses_date ON public.business_expenses(expense_date);
CREATE INDEX idx_business_expenses_category ON public.business_expenses(tax_category);
CREATE INDEX idx_business_expenses_status ON public.business_expenses(status);
CREATE INDEX idx_business_expenses_type ON public.business_expenses(expense_type);

-- Swiss tax category reference table
CREATE TABLE public.tax_categories (
  id text PRIMARY KEY,
  name_de text NOT NULL,
  name_en text NOT NULL,
  description_de text,
  description_en text,
  vat_deductible boolean DEFAULT true,
  business_deductible boolean DEFAULT true,
  requires_business_purpose boolean DEFAULT false,
  sort_order integer DEFAULT 0
);

-- Insert Swiss tax categories
INSERT INTO public.tax_categories (id, name_de, name_en, description_de, description_en, requires_business_purpose, sort_order) VALUES
('operating_expenses', 'Betriebsausgaben', 'Operating Expenses', 'Allgemeine Betriebskosten', 'General operating costs', false, 1),
('office_supplies', 'Büromaterial', 'Office Supplies', 'Büroartikel und Verbrauchsmaterial', 'Office articles and consumables', false, 2),
('rent', 'Miete', 'Rent', 'Büro- und Geschäftsraummiete', 'Office and business space rent', false, 3),
('utilities', 'Nebenkosten', 'Utilities', 'Strom, Wasser, Heizung, Internet', 'Electricity, water, heating, internet', false, 4),
('travel', 'Reisekosten', 'Travel Expenses', 'Geschäftsreisen und Fahrkosten', 'Business travel and transportation', true, 5),
('meals', 'Bewirtung', 'Meals & Entertainment', 'Geschäftsessen und Bewirtung', 'Business meals and entertainment', true, 6),
('vehicle', 'Fahrzeugkosten', 'Vehicle Expenses', 'Auto, Benzin, Versicherung', 'Car, fuel, insurance', false, 7),
('insurance', 'Versicherungen', 'Insurance', 'Betriebsversicherungen', 'Business insurance', false, 8),
('professional_services', 'Beratung', 'Professional Services', 'Anwalt, Steuerberater, Beratung', 'Lawyer, tax advisor, consulting', false, 9),
('marketing', 'Marketing', 'Marketing', 'Werbung und Marketing', 'Advertising and marketing', false, 10),
('equipment', 'Ausrüstung', 'Equipment', 'Computer, Möbel, Geräte', 'Computers, furniture, devices', false, 11),
('software', 'Software', 'Software', 'Software-Lizenzen und Abonnements', 'Software licenses and subscriptions', false, 12),
('training', 'Weiterbildung', 'Training', 'Schulungen und Weiterbildung', 'Training and education', false, 13),
('telecommunications', 'Telekommunikation', 'Telecommunications', 'Telefon, Internet, Mobilfunk', 'Phone, internet, mobile', false, 14),
('maintenance', 'Wartung', 'Maintenance', 'Reparaturen und Wartung', 'Repairs and maintenance', false, 15),
('other', 'Sonstiges', 'Other', 'Andere Ausgaben', 'Other expenses', true, 99);

-- Enable RLS for tax categories (read-only for all authenticated users)
ALTER TABLE public.tax_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_categories_read_all" 
ON public.tax_categories 
FOR SELECT 
USING (true);

-- Create view for tax reporting
CREATE VIEW public.tax_report_view AS
SELECT 
  be.vendor_id,
  EXTRACT(YEAR FROM be.expense_date) as tax_year,
  EXTRACT(MONTH FROM be.expense_date) as tax_month,
  be.tax_category,
  tc.name_de as category_name,
  COUNT(*) as expense_count,
  SUM(be.amount) as total_amount,
  SUM(be.vat_amount) as total_vat,
  SUM(be.net_amount) as total_net,
  ARRAY_AGG(DISTINCT be.expense_type) as expense_types
FROM public.business_expenses be
LEFT JOIN public.tax_categories tc ON be.tax_category = tc.id
WHERE be.status = 'paid'
GROUP BY be.vendor_id, tax_year, tax_month, be.tax_category, tc.name_de, tc.sort_order
ORDER BY tax_year DESC, tax_month DESC, tc.sort_order;