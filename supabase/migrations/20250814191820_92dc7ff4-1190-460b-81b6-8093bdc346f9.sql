-- Let's manually delete one of the duplicate customers
DELETE FROM public.customers 
WHERE id = '81cc42b9-61d3-4284-afda-07a39f69d742' 
AND name = 'Lagina Cicek';