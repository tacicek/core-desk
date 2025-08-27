-- Secure Admin Management Migration
-- This migration removes hardcoded admin user IDs and implements dynamic admin management

-- Function to safely create super admin from email
CREATE OR REPLACE FUNCTION public.create_super_admin(admin_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_user_id UUID;
  existing_admin_id UUID;
BEGIN
  -- Validate email format
  IF admin_email IS NULL OR admin_email = '' OR admin_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email format: %', admin_email;
  END IF;

  -- Get user ID from email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email 
  AND email_confirmed_at IS NOT NULL;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found or email not confirmed', admin_email;
  END IF;
  
  -- Check if user is already an admin
  SELECT id INTO existing_admin_id
  FROM public.admin_users
  WHERE user_id = admin_user_id;
  
  IF existing_admin_id IS NOT NULL THEN
    -- Update existing admin to super admin
    UPDATE public.admin_users 
    SET 
      is_super_admin = true,
      permissions = '{"full_access": true, "manage_tenants": true, "manage_subscriptions": true, "manage_support": true}'::jsonb,
      updated_at = now()
    WHERE user_id = admin_user_id;
    
    RAISE NOTICE 'User % promoted to super admin', admin_email;
  ELSE
    -- Create new admin record
    INSERT INTO public.admin_users (user_id, is_super_admin, permissions)
    VALUES (
      admin_user_id, 
      true, 
      '{"full_access": true, "manage_tenants": true, "manage_subscriptions": true, "manage_support": true}'::jsonb
    );
    
    RAISE NOTICE 'User % created as super admin', admin_email;
  END IF;
  
  -- Log the admin creation
  INSERT INTO public.audit_logs (action, admin_user_id, details)
  VALUES (
    'CREATE_SUPER_ADMIN',
    admin_user_id,
    jsonb_build_object(
      'email', admin_email,
      'created_by', 'system',
      'timestamp', now()
    )
  );
  
  RETURN admin_user_id;
END;
$$;

-- Function to revoke super admin privileges
CREATE OR REPLACE FUNCTION public.revoke_super_admin(admin_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_user_id UUID;
  current_admin_count INTEGER;
BEGIN
  -- Validate email format
  IF admin_email IS NULL OR admin_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Get user ID from email
  SELECT u.id INTO admin_user_id 
  FROM auth.users u
  JOIN public.admin_users au ON u.id = au.user_id
  WHERE u.email = admin_email 
  AND au.is_super_admin = true;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Super admin with email % not found', admin_email;
  END IF;
  
  -- Check if this is the last super admin
  SELECT COUNT(*) INTO current_admin_count
  FROM public.admin_users
  WHERE is_super_admin = true;
  
  IF current_admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot revoke the last super admin. At least one super admin must remain.';
  END IF;
  
  -- Revoke super admin privileges
  UPDATE public.admin_users 
  SET 
    is_super_admin = false,
    permissions = '{"basic_admin": true}'::jsonb,
    updated_at = now()
  WHERE user_id = admin_user_id;
  
  -- Log the admin revocation
  INSERT INTO public.audit_logs (action, admin_user_id, details)
  VALUES (
    'REVOKE_SUPER_ADMIN',
    admin_user_id,
    jsonb_build_object(
      'email', admin_email,
      'revoked_by', auth.uid(),
      'timestamp', now()
    )
  );
  
  RAISE NOTICE 'Super admin privileges revoked for %', admin_email;
  RETURN true;
END;
$$;

-- Function to list all admin users
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  is_super_admin BOOLEAN,
  permissions JSONB,
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only super admins can list admin users
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    au.user_id,
    u.email,
    au.is_super_admin,
    au.permissions,
    au.created_at,
    u.last_sign_in_at
  FROM public.admin_users au
  JOIN auth.users u ON au.user_id = u.id
  ORDER BY au.is_super_admin DESC, au.created_at ASC;
END;
$$;

-- Function to safely migrate existing hardcoded admins
CREATE OR REPLACE FUNCTION public.migrate_hardcoded_admins()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  migration_result TEXT := '';
  admin_record RECORD;
  user_email TEXT;
BEGIN
  -- Find all existing admin users and get their emails
  FOR admin_record IN 
    SELECT au.user_id, au.is_super_admin
    FROM public.admin_users au
    JOIN auth.users u ON au.user_id = u.id
    WHERE u.email IS NOT NULL
  LOOP
    -- Get the email for this admin
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = admin_record.user_id;
    
    -- Log this admin in migration result
    migration_result := migration_result || 
      'Found admin: ' || user_email || 
      ' (Super: ' || admin_record.is_super_admin || ')' || chr(10);
  END LOOP;
  
  -- Remove any admin entries that don't have valid user accounts
  DELETE FROM public.admin_users
  WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IS NOT NULL AND email_confirmed_at IS NOT NULL
  );
  
  migration_result := migration_result || 'Cleaned up invalid admin entries.' || chr(10);
  
  -- Ensure we have at least one super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE is_super_admin = true
  ) THEN
    migration_result := migration_result || 
      'WARNING: No super admin found after migration. Please create one manually.' || chr(10);
  END IF;
  
  RETURN migration_result;
END;
$$;

-- Clean up any existing hardcoded admin entries that might be invalid
-- This is safe because we're only removing entries without valid user accounts
DELETE FROM public.admin_users
WHERE user_id NOT IN (
  SELECT id 
  FROM auth.users 
  WHERE email IS NOT NULL 
  AND email_confirmed_at IS NOT NULL
);

-- Grant execute permissions on admin management functions
GRANT EXECUTE ON FUNCTION public.create_super_admin(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_super_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_hardcoded_admins() TO service_role;

-- Add audit trigger for admin_users table
CREATE OR REPLACE FUNCTION public.audit_admin_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, admin_user_id, details)
    VALUES (
      'ADMIN_CREATED',
      NEW.user_id,
      jsonb_build_object(
        'is_super_admin', NEW.is_super_admin,
        'permissions', NEW.permissions,
        'created_by', auth.uid()
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (action, admin_user_id, details)
    VALUES (
      'ADMIN_UPDATED',
      NEW.user_id,
      jsonb_build_object(
        'old_is_super_admin', OLD.is_super_admin,
        'new_is_super_admin', NEW.is_super_admin,
        'old_permissions', OLD.permissions,
        'new_permissions', NEW.permissions,
        'updated_by', auth.uid()
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (action, admin_user_id, details)
    VALUES (
      'ADMIN_DELETED',
      OLD.user_id,
      jsonb_build_object(
        'was_super_admin', OLD.is_super_admin,
        'permissions', OLD.permissions,
        'deleted_by', auth.uid()
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for auditing admin changes
DROP TRIGGER IF EXISTS audit_admin_changes_trigger ON public.admin_users;
CREATE TRIGGER audit_admin_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes();

-- Add helpful comments
COMMENT ON FUNCTION public.create_super_admin(TEXT) IS 'Safely creates a super admin from an email address. Validates user exists and email is confirmed.';
COMMENT ON FUNCTION public.revoke_super_admin(TEXT) IS 'Revokes super admin privileges from a user. Prevents removal of the last super admin.';
COMMENT ON FUNCTION public.list_admin_users() IS 'Lists all admin users with their details. Only accessible by super admins.';
COMMENT ON FUNCTION public.migrate_hardcoded_admins() IS 'Safely migrates any existing hardcoded admin entries.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Secure admin management system installed successfully!';
  RAISE NOTICE 'Use SELECT public.create_super_admin(''your-email@domain.com'') to create a super admin.';
  RAISE NOTICE 'Use SELECT public.list_admin_users() to view all admin users.';
END
$$;