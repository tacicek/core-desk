-- Enable Row Level Security on customers table and other sensitive tables
-- This fixes the critical security vulnerability where customer data was exposed

-- Enable RLS on customers table (this is the primary security fix)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Double-check and enable RLS on other sensitive tables that might be missing it
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Ensure all view tables also have RLS enabled
ALTER TABLE public.annual_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_report_view ENABLE ROW LEVEL SECURITY;