-- Create a separate secure table for API keys and sensitive data
CREATE TABLE IF NOT EXISTS public.vendor_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  user_id UUID NOT NULL,
  secret_type TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  
  UNIQUE(vendor_id, secret_type)
);

-- Enable RLS on vendor_secrets table
ALTER TABLE public.vendor_secrets ENABLE ROW LEVEL SECURITY;

-- Create more restrictive policies for vendor_secrets
-- Only vendor owners can manage secrets
CREATE POLICY "vendor_secrets_owner_only" 
ON public.vendor_secrets 
FOR ALL 
USING (
  vendor_id = get_user_vendor_id() 
  AND is_vendor_owner()
);

-- Remove API key from company_settings table (migration)
-- First, migrate existing resend_api_key values to vendor_secrets
DO $$
DECLARE
    settings_row RECORD;
BEGIN
    FOR settings_row IN 
        SELECT vendor_id, user_id, resend_api_key 
        FROM public.company_settings 
        WHERE resend_api_key IS NOT NULL AND resend_api_key != ''
    LOOP
        INSERT INTO public.vendor_secrets (vendor_id, user_id, secret_type, encrypted_value, created_by)
        VALUES (
            settings_row.vendor_id, 
            settings_row.user_id, 
            'resend_api_key', 
            settings_row.resend_api_key,
            settings_row.user_id
        )
        ON CONFLICT (vendor_id, secret_type) DO UPDATE 
        SET encrypted_value = EXCLUDED.encrypted_value,
            updated_at = now();
    END LOOP;
END $$;

-- Now remove the API key column from company_settings
ALTER TABLE public.company_settings DROP COLUMN IF EXISTS resend_api_key;

-- Add trigger for automatic timestamp updates on vendor_secrets
CREATE TRIGGER update_vendor_secrets_updated_at
BEFORE UPDATE ON public.vendor_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a secure function to get API keys (only for edge functions)
CREATE OR REPLACE FUNCTION public.get_vendor_api_key(vendor_id_param UUID, secret_type_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    api_key TEXT;
BEGIN
    -- This function can only be called by the service role
    SELECT encrypted_value INTO api_key
    FROM public.vendor_secrets
    WHERE vendor_id = vendor_id_param 
    AND secret_type = secret_type_param;
    
    RETURN api_key;
END;
$$;

-- Grant execute permission only to service role for security
REVOKE ALL ON FUNCTION public.get_vendor_api_key(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vendor_api_key(UUID, TEXT) TO service_role;