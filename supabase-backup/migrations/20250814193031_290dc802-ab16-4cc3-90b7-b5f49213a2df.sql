-- Add missing created_at and updated_at columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to update updated_at
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();