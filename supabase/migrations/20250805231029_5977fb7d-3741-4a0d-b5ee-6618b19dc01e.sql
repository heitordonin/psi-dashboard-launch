-- Enable realtime for subscription_overrides table
ALTER TABLE public.subscription_overrides REPLICA IDENTITY FULL;

-- Add the table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'subscription_overrides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_overrides;
  END IF;
END $$;

-- Create a cron job to run expired overrides cleanup every hour
SELECT cron.schedule(
  'sync-expired-overrides-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://xwaxvupymmlbehlocyzt.supabase.co/functions/v1/sync-expired-overrides',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YXh2dXB5bW1sYmVobG9jeXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzc1NzYsImV4cCI6MjA2NDU1MzU3Nn0.t3jxj74dZmzGzHiJJQL9-pgc2JT1KupqYma1JMMI8u8"}'::jsonb,
        body:='{"trigger": "cron_job", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Create function to manually trigger sync for expired overrides (for admin use)
CREATE OR REPLACE FUNCTION public.trigger_expired_overrides_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only allow admins to trigger this function
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;

  -- Call the edge function
  SELECT net.http_post(
    url := 'https://xwaxvupymmlbehlocyzt.supabase.co/functions/v1/sync-expired-overrides',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YXh2dXB5bW1sYmVobG9jeXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzc1NzYsImV4cCI6MjA2NDU1MzU3Nn0.t3jxj74dZmzGzHiJJQL9-pgc2JT1KupqYma1JMMI8u8"}'::jsonb,
    body := jsonb_build_object(
      'trigger', 'manual_admin',
      'timestamp', now(),
      'admin_user_id', auth.uid()
    )
  ) INTO result;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Sync triggered successfully',
    'request_id', result,
    'timestamp', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$;