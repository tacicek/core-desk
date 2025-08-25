-- Create subscription_plans table for managing available plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CHF',
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
  max_users INTEGER DEFAULT 5,
  max_invoices_per_month INTEGER DEFAULT 100,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stripe_price_id TEXT,
  trial_period_days INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription plans
CREATE POLICY "Super admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (is_super_admin_safe());

CREATE POLICY "Public can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, billing_interval, max_users, max_invoices_per_month, features, sort_order, stripe_price_id) VALUES
('Starter', 'Perfekt für Einzelunternehmer und kleine Betriebe', 29, 'monthly', 1, 50, '["invoicing", "basic_expenses", "qr_bills", "email_support"]', 1, 'price_starter_monthly'),
('Professional', 'Ideal für wachsende KMUs und Teams', 79, 'monthly', 10, -1, '["invoicing", "full_expenses", "payroll", "api_integration", "priority_support", "advanced_reports"]', 2, 'price_professional_monthly'),
('Enterprise', 'Für große Unternehmen mit speziellen Anforderungen', 199, 'monthly', -1, -1, '["all_features", "dedicated_support", "custom_integrations", "audit_logs", "white_label"]', 3, 'price_enterprise_monthly'),
('Starter', 'Perfekt für Einzelunternehmer und kleine Betriebe (Jährlich)', 290, 'yearly', 1, 50, '["invoicing", "basic_expenses", "qr_bills", "email_support"]', 4, 'price_starter_yearly'),
('Professional', 'Ideal für wachsende KMUs und Teams (Jährlich)', 790, 'yearly', 10, -1, '["invoicing", "full_expenses", "payroll", "api_integration", "priority_support", "advanced_reports"]', 5, 'price_professional_yearly'),
('Enterprise', 'Für große Unternehmen mit speziellen Anforderungen (Jährlich)', 1990, 'yearly', -1, -1, '["all_features", "dedicated_support", "custom_integrations", "audit_logs", "white_label"]', 6, 'price_enterprise_yearly');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_plans_updated_at();