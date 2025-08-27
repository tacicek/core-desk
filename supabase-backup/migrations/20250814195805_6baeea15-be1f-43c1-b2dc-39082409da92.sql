-- Fix the delete_customer_by_id function
-- Remove the old function and create a simple, working version

DROP FUNCTION IF EXISTS public.delete_customer_by_id(uuid);

CREATE OR REPLACE FUNCTION public.delete_customer_by_id(customer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Simple delete without calling other functions that might not exist
  DELETE FROM public.customers 
  WHERE id = customer_id;
  
  -- Return true if row was deleted, false if not found
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;