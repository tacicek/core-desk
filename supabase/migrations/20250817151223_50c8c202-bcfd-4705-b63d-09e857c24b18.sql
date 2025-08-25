-- Create a function to safely delete daily revenue
CREATE OR REPLACE FUNCTION delete_daily_revenue(p_id uuid, p_vendor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete the revenue record
  DELETE FROM daily_revenue 
  WHERE id = p_id 
  AND vendor_id = p_vendor_id 
  AND vendor_id = get_user_vendor_id(); -- Extra security check
  
  -- Return true if a row was deleted
  RETURN FOUND;
END;
$$;