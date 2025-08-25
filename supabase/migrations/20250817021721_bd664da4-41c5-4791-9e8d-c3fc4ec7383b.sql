-- Add foreign key constraint between invoice_items and invoices if it doesn't exist
DO $$
BEGIN
    -- Check if foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoice_items_invoice_id_fkey' 
        AND table_name = 'invoice_items'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.invoice_items 
        ADD CONSTRAINT invoice_items_invoice_id_fkey 
        FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
    END IF;
END $$;