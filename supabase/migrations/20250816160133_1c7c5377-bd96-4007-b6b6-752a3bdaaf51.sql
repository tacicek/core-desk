-- Update the admin user's email from gmail to outlook
UPDATE public.company_settings 
SET email = 'tuncaycicek@outlook.com'
WHERE user_id = 'd11a2629-8024-4d1c-a230-f96f1a9674dd' 
AND email = 'tuncaycicek@gmail.com';

-- Verify the update
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