-- =====================================================
-- AUTHENTICATION SYNCHRONIZATION FIX
-- =====================================================
-- This migration fixes the core authentication issue by ensuring
-- that database records are automatically created when users
-- are registered in Supabase Auth

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREATE AUTOMATIC USER PROFILE TRIGGER
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    default_vendor_id UUID;
BEGIN
    -- Log the new user creation
    RAISE LOG 'Creating user profile for new auth user: %', NEW.id;
    
    -- Try to get a default vendor or create one if none exists
    SELECT id INTO default_vendor_id FROM public.vendors LIMIT 1;
    
    -- If no vendor exists, create a default one
    IF default_vendor_id IS NULL THEN
        INSERT INTO public.vendors (
            name, 
            slug, 
            email, 
            is_active
        ) VALUES (
            'Default Company',
            'default-company',
            COALESCE(NEW.email, 'admin@company.com'),
            true
        ) RETURNING id INTO default_vendor_id;
        
        RAISE LOG 'Created default vendor: %', default_vendor_id;
    END IF;
    
    -- Create user profile
    INSERT INTO public.user_profiles (
        user_id,
        vendor_id,
        first_name,
        last_name,
        email,
        role,
        is_owner
    ) VALUES (
        NEW.id,
        default_vendor_id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
        true
    );
    
    RAISE LOG 'Created user profile for: %', NEW.id;
    
    -- Create admin user record for super admin access
    INSERT INTO public.admin_users (
        user_id,
        is_super_admin,
        permissions
    ) VALUES (
        NEW.id,
        true,
        '{"full_access": true}'::jsonb
    );
    
    RAISE LOG 'Created admin record for: %', NEW.id;
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================
-- 2. CREATE TRIGGER FOR NEW USER REGISTRATION
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. CREATE FUNCTION TO FIX EXISTING USERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.fix_existing_auth_users()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user RECORD;
    default_vendor_id UUID;
    users_fixed INTEGER := 0;
    result_text TEXT;
BEGIN
    -- Get or create default vendor
    SELECT id INTO default_vendor_id FROM public.vendors LIMIT 1;
    
    IF default_vendor_id IS NULL THEN
        INSERT INTO public.vendors (
            name, 
            slug, 
            email, 
            is_active
        ) VALUES (
            'Default Company',
            'default-company',
            'admin@company.com',
            true
        ) RETURNING id INTO default_vendor_id;
    END IF;
    
    -- Process each auth user that doesn't have a profile
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
        FROM auth.users au
        LEFT JOIN public.user_profiles up ON au.id = up.user_id
        WHERE up.user_id IS NULL
    LOOP
        BEGIN
            -- Create user profile
            INSERT INTO public.user_profiles (
                user_id,
                vendor_id,
                first_name,
                last_name,
                email,
                role,
                is_owner
            ) VALUES (
                auth_user.id,
                default_vendor_id,
                COALESCE(auth_user.raw_user_meta_data->>'first_name', 'Admin'),
                COALESCE(auth_user.raw_user_meta_data->>'last_name', 'User'),
                auth_user.email,
                COALESCE(auth_user.raw_user_meta_data->>'role', 'admin'),
                true
            );
            
            -- Create admin record if it doesn't exist
            INSERT INTO public.admin_users (
                user_id,
                is_super_admin,
                permissions
            ) VALUES (
                auth_user.id,
                true,
                '{"full_access": true}'::jsonb
            ) ON CONFLICT (user_id) DO UPDATE SET
                is_super_admin = true,
                permissions = '{"full_access": true}'::jsonb;
            
            users_fixed := users_fixed + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue
            RAISE LOG 'Error fixing user %: %', auth_user.id, SQLERRM;
        END;
    END LOOP;
    
    result_text := format('Fixed %s existing auth users', users_fixed);
    RAISE LOG '%', result_text;
    
    RETURN result_text;
END;
$$;

-- =====================================================
-- 4. RUN THE FIX FOR EXISTING USERS
-- =====================================================

-- Execute the fix function
SELECT public.fix_existing_auth_users();

-- =====================================================
-- 5. ENSURE ADMIN_USERS TABLE HAS PROPER CONSTRAINTS
-- =====================================================

-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_users_user_id_key'
    ) THEN
        ALTER TABLE public.admin_users 
        ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);
    END IF;
END
$$;

-- =====================================================
-- 6. CREATE HELPER FUNCTION FOR MANUAL AUTH REPAIR
-- =====================================================

CREATE OR REPLACE FUNCTION public.repair_user_auth(user_email TEXT, user_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_user_id UUID;
    vendor_id UUID;
    result_text TEXT;
BEGIN
    -- Check if we can find the user by email in auth.users
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF existing_user_id IS NULL THEN
        RETURN 'User not found in auth.users. Use Supabase auth.signUp() first.';
    END IF;
    
    -- Get or create vendor
    SELECT id INTO vendor_id FROM public.vendors LIMIT 1;
    IF vendor_id IS NULL THEN
        INSERT INTO public.vendors (name, slug, email, is_active) 
        VALUES ('Default Company', 'default-company', user_email, true) 
        RETURNING id INTO vendor_id;
    END IF;
    
    -- Ensure user profile exists
    INSERT INTO public.user_profiles (
        user_id, vendor_id, first_name, last_name, email, role, is_owner
    ) VALUES (
        existing_user_id, vendor_id, 'Admin', 'User', user_email, 'admin', true
    ) ON CONFLICT (user_id) DO UPDATE SET
        vendor_id = EXCLUDED.vendor_id,
        email = EXCLUDED.email,
        role = 'admin',
        is_owner = true;
    
    -- Ensure admin record exists
    INSERT INTO public.admin_users (
        user_id, is_super_admin, permissions
    ) VALUES (
        existing_user_id, true, '{"full_access": true}'::jsonb
    ) ON CONFLICT (user_id) DO UPDATE SET
        is_super_admin = true,
        permissions = '{"full_access": true}'::jsonb;
    
    result_text := format('Successfully repaired auth for user: %s (ID: %s)', user_email, existing_user_id);
    RETURN result_text;
END;
$$;

-- =====================================================
-- 7. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fix_existing_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.repair_user_auth(TEXT, TEXT) TO authenticated;

-- =====================================================
-- 8. CREATE INDEX FOR PERFORMANCE
-- =====================================================

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
    RAISE LOG 'Authentication synchronization fix migration completed successfully';
END
$$;

-- Test the setup by trying to repair the known admin user
SELECT public.repair_user_auth('tuncaycicek@outlook.com', 'Rz8#mK2$vL9@nX4!');