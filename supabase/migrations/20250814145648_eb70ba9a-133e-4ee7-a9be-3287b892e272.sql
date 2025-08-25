-- Create vendor and profile for existing user d11a2629-8024-4d1c-a230-f96f1a9674dd
DO $$
DECLARE
  new_vendor_id uuid;
  existing_user_id uuid := 'd11a2629-8024-4d1c-a230-f96f1a9674dd';
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = existing_user_id) THEN
    -- Create vendor for the user
    INSERT INTO public.vendors (name, slug, is_active)
    VALUES ('Meine Firma', 'meine-firma-' || substring(existing_user_id::text, 1, 8), true)
    RETURNING id INTO new_vendor_id;

    -- Create user profile
    INSERT INTO public.user_profiles (
      user_id, 
      vendor_id, 
      is_owner, 
      role
    )
    VALUES (
      existing_user_id,
      new_vendor_id,
      true,
      'admin'
    );

    -- Create default company settings
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
      existing_user_id,
      new_vendor_id,
      'Meine Firma',
      'tuncaycicek@gmail.com',
      8.1,
      30,
      'F-{YYYY}-{MM}-{###}'
    );

    RAISE NOTICE 'Created vendor and profile for user %', existing_user_id;
  ELSE
    RAISE NOTICE 'Profile already exists for user %', existing_user_id;
  END IF;
END $$;