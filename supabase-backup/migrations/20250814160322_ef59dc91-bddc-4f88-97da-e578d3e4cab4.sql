-- Create daily_revenue table for tracking daily revenue/income
CREATE TABLE public.daily_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  revenue_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CHF',
  description TEXT,
  source TEXT DEFAULT 'manual', -- 'manual', 'email', 'import'
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_revenue ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor access
CREATE POLICY "daily_revenue_vendor_select" 
ON public.daily_revenue 
FOR SELECT 
USING (vendor_id = get_user_vendor_id());

CREATE POLICY "daily_revenue_vendor_modify" 
ON public.daily_revenue 
FOR ALL 
USING (vendor_id = get_user_vendor_id());

-- Create employee_expenses table for tracking employee-related expenses
CREATE TABLE public.employee_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  expense_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CHF',
  expense_type TEXT NOT NULL DEFAULT 'salary', -- 'salary', 'benefits', 'training', 'travel', 'other'
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor access
CREATE POLICY "employee_expenses_vendor_select" 
ON public.employee_expenses 
FOR SELECT 
USING (vendor_id = get_user_vendor_id());

CREATE POLICY "employee_expenses_vendor_modify" 
ON public.employee_expenses 
FOR ALL 
USING (vendor_id = get_user_vendor_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_revenue_updated_at
BEFORE UPDATE ON public.daily_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_expenses_updated_at
BEFORE UPDATE ON public.employee_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for annual summary
CREATE VIEW public.annual_summary AS
SELECT 
  vendor_id,
  EXTRACT(YEAR FROM revenue_date) as year,
  'revenue' as category,
  SUM(amount) as total_amount,
  COUNT(*) as entry_count
FROM public.daily_revenue
GROUP BY vendor_id, EXTRACT(YEAR FROM revenue_date)

UNION ALL

SELECT 
  vendor_id,
  EXTRACT(YEAR FROM expense_date) as year,
  'business_expenses' as category,
  SUM(amount) as total_amount,
  COUNT(*) as entry_count
FROM public.business_expenses
GROUP BY vendor_id, EXTRACT(YEAR FROM expense_date)

UNION ALL

SELECT 
  vendor_id,
  EXTRACT(YEAR FROM invoice_date) as year,
  'incoming_invoices' as category,
  SUM(amount) as total_amount,
  COUNT(*) as entry_count
FROM public.incoming_invoices
GROUP BY vendor_id, EXTRACT(YEAR FROM invoice_date)

UNION ALL

SELECT 
  vendor_id,
  EXTRACT(YEAR FROM expense_date) as year,
  'employee_expenses' as category,
  SUM(amount) as total_amount,
  COUNT(*) as entry_count
FROM public.employee_expenses
GROUP BY vendor_id, EXTRACT(YEAR FROM expense_date);