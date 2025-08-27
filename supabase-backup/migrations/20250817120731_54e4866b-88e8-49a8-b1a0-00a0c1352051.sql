-- Approve the pending user and tenant
UPDATE user_profiles 
SET approval_status = 'approved' 
WHERE user_id = 'd11a2629-8024-4d1c-a230-f96f1a9674dd' AND approval_status = 'pending';

UPDATE tenants 
SET approval_status = 'approved', 
    approved_at = now(),
    approved_by = 'd11a2629-8024-4d1c-a230-f96f1a9674dd'
WHERE contact_email = 'tuncaycicek@gmail.com' AND approval_status = 'pending';