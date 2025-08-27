-- Add INSERT policy for vendors table to allow authenticated users to create vendors
CREATE POLICY "Allow authenticated users to create vendors" 
ON public.vendors 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also update the trigger function to properly handle the vendor creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_vendor_id uuid;
BEGIN
  -- Create a new vendor for the user
  INSERT INTO public.vendors (name, slug, is_active)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Meine Firma'),
    lower(replace(COALESCE(NEW.raw_user_meta_data->>'company_name', 'meine-firma'), ' ', '-')) || '-' || substring(NEW.id::text, 1, 8),
    true
  )
  RETURNING id INTO new_vendor_id;

  -- Create user profile linked to the vendor
  INSERT INTO public.user_profiles (
    user_id, 
    vendor_id, 
    is_owner, 
    role,
    first_name, 
    last_name
  )
  VALUES (
    NEW.id,
    new_vendor_id,
    true,
    'admin',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );

  -- Create default company settings for the vendor
  INSERT INTO public.company_settings (
    user_id,
    vendor_id,
    name,
    email,
    default_tax_rate,
    default_due_days,
    invoice_number_format
  )
  VALUES (
    NEW.id,
    new_vendor_id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Meine Firma'),
    NEW.email,
    8.1,
    30,
    'F-{YYYY}-{MM}-{###}'
  );

  RETURN NEW;
END;
$$;