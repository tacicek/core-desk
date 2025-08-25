-- Make vendor_id NOT NULL in invoices table since it's required for RLS
UPDATE public.invoices SET vendor_id = created_by WHERE vendor_id IS NULL;

ALTER TABLE public.invoices ALTER COLUMN vendor_id SET NOT NULL;

-- Also check invoice_items structure
DO $$
BEGIN
    -- Ensure invoice_items has all required columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.invoice_items ADD COLUMN created_by uuid NOT NULL DEFAULT auth.uid();
    END IF;
END $$;