-- Add approval status to tenants and user_profiles
ALTER TABLE public.tenants 
ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approval_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN approved_by uuid,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text;

ALTER TABLE public.user_profiles
ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update existing records to be approved
UPDATE public.tenants SET approval_status = 'approved', approved_at = now() WHERE approval_status IS NULL;
UPDATE public.user_profiles SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Create function to approve tenant
CREATE OR REPLACE FUNCTION public.approve_tenant(
  p_tenant_id uuid,
  p_approval_token uuid,
  p_approved_by uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tenant_record RECORD;
  result json;
BEGIN
  -- Get tenant by ID and token
  SELECT * INTO tenant_record
  FROM public.tenants 
  WHERE id = p_tenant_id 
  AND approval_token = p_approval_token 
  AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid approval token or tenant already processed');
  END IF;
  
  -- Update tenant status
  UPDATE public.tenants 
  SET 
    approval_status = 'approved',
    approved_by = COALESCE(p_approved_by, auth.uid()),
    approved_at = now()
  WHERE id = p_tenant_id;
  
  -- Update all user profiles for this tenant
  UPDATE public.user_profiles 
  SET approval_status = 'approved'
  WHERE tenant_id = p_tenant_id;
  
  -- Return success with tenant info
  RETURN json_build_object(
    'success', true, 
    'message', 'Tenant approved successfully',
    'tenant_id', p_tenant_id,
    'company_name', tenant_record.company_name,
    'contact_email', tenant_record.contact_email
  );
END;
$$;

-- Create function to reject tenant
CREATE OR REPLACE FUNCTION public.reject_tenant(
  p_tenant_id uuid,
  p_approval_token uuid,
  p_rejection_reason text DEFAULT NULL,
  p_approved_by uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tenant_record RECORD;
BEGIN
  -- Get tenant by ID and token
  SELECT * INTO tenant_record
  FROM public.tenants 
  WHERE id = p_tenant_id 
  AND approval_token = p_approval_token 
  AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid approval token or tenant already processed');
  END IF;
  
  -- Update tenant status
  UPDATE public.tenants 
  SET 
    approval_status = 'rejected',
    approved_by = COALESCE(p_approved_by, auth.uid()),
    approved_at = now(),
    rejection_reason = p_rejection_reason
  WHERE id = p_tenant_id;
  
  -- Update all user profiles for this tenant
  UPDATE public.user_profiles 
  SET approval_status = 'rejected'
  WHERE tenant_id = p_tenant_id;
  
  -- Return success with tenant info
  RETURN json_build_object(
    'success', true, 
    'message', 'Tenant rejected successfully',
    'tenant_id', p_tenant_id,
    'company_name', tenant_record.company_name,
    'contact_email', tenant_record.contact_email
  );
END;
$$;