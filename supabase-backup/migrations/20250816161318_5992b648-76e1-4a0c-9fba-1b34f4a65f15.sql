-- Make the new user (tuncaycicek@outlook.com) the super admin
-- First, add the new user to admin_users table
INSERT INTO public.admin_users (user_id, is_super_admin, permissions)
VALUES (
  '4e228b7a-9fdb-43b5-9d3b-5bf0df42609b', -- The new user's ID from auth logs
  true,
  '{"full_access": true}'::jsonb
);

-- Update company_settings to point to the new admin user
UPDATE public.company_settings 
SET user_id = '4e228b7a-9fdb-43b5-9d3b-5bf0df42609b'
WHERE user_id = 'd11a2629-8024-4d1c-a230-f96f1a9674dd';

-- Optional: Remove super admin privileges from old user (keep them as regular admin)
UPDATE public.admin_users 
SET is_super_admin = false
WHERE user_id = 'd11a2629-8024-4d1c-a230-f96f1a9674dd';

-- Verify the changes
SELECT 
  au.user_id,
  au.is_super_admin,
  cs.email,
  up.first_name,
  up.last_name
FROM admin_users au
LEFT JOIN company_settings cs ON au.user_id = cs.user_id
LEFT JOIN user_profiles up ON au.user_id = up.user_id
WHERE au.is_super_admin = true;