-- Performance indexes for reminders selection
CREATE INDEX IF NOT EXISTS idx_appointments_user_start_status
  ON public.appointments (user_id, start_datetime, status);

CREATE INDEX IF NOT EXISTS idx_reminder_deliveries_appointment
  ON public.appointment_reminder_deliveries (appointment_id);

-- Schedule cron to invoke automatic reminders every minute
DO $$
BEGIN
  -- Unschedule existing job if present
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'send-automatic-appointment-reminders-every-minute'
  ) THEN
    PERFORM cron.unschedule('send-automatic-appointment-reminders-every-minute');
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- pg_cron not available; ignore unschedule
  NULL;
END$$;

-- Create (or replace) the scheduled job
SELECT cron.schedule(
  'send-automatic-appointment-reminders-every-minute',
  '* * * * *',
  $$
  select
    net.http_post(
      url := 'https://xwaxvupymmlbehlocyzt.supabase.co/functions/v1/send-automatic-appointment-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YXh2dXB5bW1sYmVobG9jeXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzc1NzYsImV4cCI6MjA2NDU1MzU3Nn0.t3jxj74dZmzGzHiJJQL9-pgc2JT1KupqYma1JMMI8u8'
      ),
      body := jsonb_build_object('trigger','cron','timestamp', now())
    ) as request_id;
  $$
);
