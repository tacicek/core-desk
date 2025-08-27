-- Create a function to delete customer by ID
CREATE OR REPLACE FUNCTION delete_customer_by_id(customer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.customers WHERE id = customer_id;
  
  -- Return true if row was deleted
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;