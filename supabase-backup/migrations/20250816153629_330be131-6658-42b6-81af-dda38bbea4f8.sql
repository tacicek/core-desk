-- Create super admin for existing user
INSERT INTO public.admin_users (user_id, is_super_admin, permissions)
VALUES (
  'd11a2629-8024-4d1c-a230-f96f1a9674dd',
  true,
  '{"all": true, "manage_tenants": true, "manage_subscriptions": true, "manage_support": true}'::jsonb
);