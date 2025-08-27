-- Drop the problematic RPC function
DROP FUNCTION IF EXISTS delete_daily_revenue(uuid, uuid);

-- Update RLS policy for daily_revenue to allow proper DELETE operations
DROP POLICY IF EXISTS "daily_revenue_vendor_modify" ON daily_revenue;
DROP POLICY IF EXISTS "daily_revenue_vendor_select" ON daily_revenue;

-- Create separate policies for each operation
CREATE POLICY "daily_revenue_vendor_select" ON daily_revenue
FOR SELECT USING (vendor_id = get_user_vendor_id());

CREATE POLICY "daily_revenue_vendor_insert" ON daily_revenue  
FOR INSERT WITH CHECK (vendor_id = get_user_vendor_id());

CREATE POLICY "daily_revenue_vendor_update" ON daily_revenue
FOR UPDATE USING (vendor_id = get_user_vendor_id());

CREATE POLICY "daily_revenue_vendor_delete" ON daily_revenue
FOR DELETE USING (vendor_id = get_user_vendor_id());