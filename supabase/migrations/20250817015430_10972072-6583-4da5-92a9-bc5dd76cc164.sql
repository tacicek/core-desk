-- Remove customer dependency from invoices table
-- Make customer_id nullable and add customer_name, customer_email fields

ALTER TABLE invoices 
ALTER COLUMN customer_id DROP NOT NULL;

-- Add customer name and email fields to store customer info directly
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Update existing invoices to have some default customer info if needed
UPDATE invoices 
SET customer_name = 'Kunde', customer_email = ''
WHERE customer_name IS NULL;

-- Remove foreign key constraint if it exists (checking first)
DO $$ 
BEGIN
    -- This will only run if the constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%customer%' 
        AND table_name = 'invoices'
    ) THEN
        ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey;
    END IF;
END $$;