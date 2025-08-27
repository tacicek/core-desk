-- Check if there are any sample customers being automatically inserted
SELECT 
  table_name,
  trigger_name,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'customers';

-- Check for any seed/sample data in customers table
SELECT 
  'customers' as table_name,
  id, 
  name, 
  vendor_id, 
  created_by,
  created_at
FROM customers 
WHERE name ILIKE '%sample%' OR name ILIKE '%test%' OR name ILIKE '%demo%'
ORDER BY created_at DESC;

-- Check if there are any background jobs or functions that might recreate data
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE prosrc ILIKE '%customers%' 
  AND prosrc ILIKE '%insert%';