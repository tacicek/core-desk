-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the overdue invoice check to run daily at 9:00 AM
SELECT cron.schedule(
  'check-overdue-invoices-daily',
  '0 9 * * *', -- 9:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://wnedqmxejgynelhtbpmw.supabase.co/functions/v1/check-overdue-invoices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZWRxbXhlamd5bmVsaHRicG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwODczNzksImV4cCI6MjA3MDY2MzM3OX0.gMxgo7HL7jG39jz5rTP0u4QzlNP_s7ZU9VRCyj8Uyic"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);