-- First check existing customers without vendor_id
SELECT id, name, email, vendor_id FROM customers WHERE vendor_id IS NULL;

-- Update existing customers to set the correct vendor_id
-- Get the vendor_id for the current user and update customers created by them
UPDATE customers 
SET vendor_id = (
  SELECT vendor_id 
  FROM user_profiles 
  WHERE user_id = customers.created_by
)
WHERE vendor_id IS NULL 
  AND created_by IS NOT NULL;

-- Also make vendor_id NOT NULL to prevent future issues
ALTER TABLE customers ALTER COLUMN vendor_id SET NOT NULL;