-- Enable Row Level Security on hello_events table
ALTER TABLE public.hello_events ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public access to hello_events (since this appears to be a public events table)
-- If this should be user-specific, we'll need to add a user_id column first
CREATE POLICY "Allow public read access to hello_events"
ON public.hello_events
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert events
CREATE POLICY "Allow authenticated users to insert hello_events"
ON public.hello_events
FOR INSERT
TO authenticated
WITH CHECK (true);