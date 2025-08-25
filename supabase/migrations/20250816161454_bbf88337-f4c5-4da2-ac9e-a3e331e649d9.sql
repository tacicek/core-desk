-- Make the new user (tuncaycicek@outlook.com) the super admin
-- Add the new user to admin_users table as super admin
INSERT INTO public.admin_users (user_id, is_super_admin, permissions)
VALUES (
  '4e228b7a-9fdb-43b5-9d3b-5bf0df42609b', -- The new user's ID
  true,
  '{"full_access": true}'::jsonb
);

-- Remove super admin privileges from old user 
UPDATE public.admin_users 
SET is_super_admin = false
WHERE user_id = 'd11a2629-8024-4d1c-a230-f96f1a9674dd';

-- Verify the changes - show all admin users
SELECT 
  au.user_id,
  au.is_super_admin,
  cs.email,
  'New Super Admin' as note
FROM admin_users au
LEFT JOIN company_settings cs ON au.user_id = cs.user_id
WHERE au.user_id = '4e228b7a-9fdb-43b5-9d3b-5bf0df42609b'

UNION ALL

SELECT 
  au.user_id,
  au.is_super_admin,
  cs.email,
  'Former Super Admin' as note
FROM admin_users au
LEFT JOIN company_settings cs ON au.user_id = cs.user_id
WHERE au.user_id = 'd11a2629-8024-4d1c-a230-f96f1a9674dd';