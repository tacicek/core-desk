-- Disable RLS on invoices temporarily to test
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;

-- Re-enable with a simpler policy
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "invoices_vendor_modify" ON public.invoices;
DROP POLICY IF EXISTS "invoices_vendor_select" ON public.invoices;

-- Create new, simpler policies
CREATE POLICY "invoices_user_access" ON public.invoices
FOR ALL USING (vendor_id = get_user_vendor_id());

-- Also check invoice_items policies
DROP POLICY IF EXISTS "invoice_items_vendor_modify" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_vendor_select" ON public.invoice_items;

-- Create simpler invoice_items policy
CREATE POLICY "invoice_items_user_access" ON public.invoice_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.vendor_id = get_user_vendor_id()
));