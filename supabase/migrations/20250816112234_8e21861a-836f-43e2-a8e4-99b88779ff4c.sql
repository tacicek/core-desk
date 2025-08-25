-- Create payroll employees table
CREATE TABLE public.payroll_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  employee_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT,
  position TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll records table
CREATE TABLE public.payroll_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  payroll_month INTEGER NOT NULL CHECK (payroll_month >= 1 AND payroll_month <= 12),
  payroll_year INTEGER NOT NULL CHECK (payroll_year >= 2020 AND payroll_year <= 2030),
  
  -- Gross salary components
  base_salary NUMERIC DEFAULT 0,
  overtime_pay NUMERIC DEFAULT 0,
  bonuses NUMERIC DEFAULT 0,
  thirteenth_salary NUMERIC DEFAULT 0,
  vacation_pay NUMERIC DEFAULT 0,
  other_income NUMERIC DEFAULT 0,
  gross_salary NUMERIC DEFAULT 0,
  
  -- Employee deductions
  ahv_iv_eo_employee NUMERIC DEFAULT 0, -- 5.3%
  alv_employee NUMERIC DEFAULT 0, -- 1.1%
  pensionskasse_employee NUMERIC DEFAULT 0,
  health_insurance_employee NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  
  -- Net salary
  net_salary NUMERIC DEFAULT 0,
  
  -- Employer costs
  ahv_iv_eo_employer NUMERIC DEFAULT 0, -- 5.3%
  alv_employer NUMERIC DEFAULT 0, -- 1.1%
  nbu_insurance NUMERIC DEFAULT 0, -- 0.7-4%
  bu_insurance NUMERIC DEFAULT 0,
  pensionskasse_employer NUMERIC DEFAULT 0,
  fak_family_allowance NUMERIC DEFAULT 0,
  krankentaggeld NUMERIC DEFAULT 0,
  other_employer_costs NUMERIC DEFAULT 0,
  total_employer_costs NUMERIC DEFAULT 0,
  
  -- Total cost to company
  total_company_cost NUMERIC DEFAULT 0,
  
  -- Metadata
  original_filename TEXT,
  file_url TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'error')),
  error_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(vendor_id, employee_id, payroll_month, payroll_year)
);

-- Create payroll processing logs table
CREATE TABLE public.payroll_processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_details JSONB,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payroll_employees
CREATE POLICY "payroll_employees_vendor_access" 
ON public.payroll_employees 
FOR ALL 
USING (vendor_id = get_user_vendor_id());

-- Create RLS policies for payroll_records
CREATE POLICY "payroll_records_vendor_access" 
ON public.payroll_records 
FOR ALL 
USING (vendor_id = get_user_vendor_id());

-- Create RLS policies for payroll_processing_logs
CREATE POLICY "payroll_processing_logs_vendor_access" 
ON public.payroll_processing_logs 
FOR ALL 
USING (vendor_id = get_user_vendor_id());

-- Create update triggers
CREATE TRIGGER update_payroll_employees_updated_at
BEFORE UPDATE ON public.payroll_employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
BEFORE UPDATE ON public.payroll_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_payroll_employees_vendor_id ON public.payroll_employees(vendor_id);
CREATE INDEX idx_payroll_records_vendor_employee ON public.payroll_records(vendor_id, employee_id);
CREATE INDEX idx_payroll_records_period ON public.payroll_records(payroll_year, payroll_month);
CREATE INDEX idx_payroll_logs_vendor_batch ON public.payroll_processing_logs(vendor_id, batch_id);