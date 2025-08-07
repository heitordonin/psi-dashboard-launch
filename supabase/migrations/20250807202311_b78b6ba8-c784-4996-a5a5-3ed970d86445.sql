-- Configurar cron job para lembretes automáticos a cada 5 minutos
-- Primeiro remover o job existente se houver
SELECT cron.unschedule('send-automatic-appointment-reminders-every-minute');

-- Criar novo cron job a cada 5 minutos
SELECT cron.schedule(
  'send-automatic-appointment-reminders-every-5-minutes',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT
    net.http_post(
        url := 'https://xwaxvupymmlbehlocyzt.supabase.co/functions/v1/send-automatic-appointment-reminders',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YXh2dXB5bW1sYmVobG9jeXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzc1NzYsImV4cCI6MjA2NDU1MzU3Nn0.t3jxj74dZmzGzHiJJQL9-pgc2JT1KupqYma1JMMI8u8"}'::jsonb,
        body := jsonb_build_object(
          'trigger', 'cron_job',
          'timestamp', now(),
          'frequency', 'every_5_minutes'
        )
    ) as request_id;
  $$
);

-- Atualizar os valores padrão dos campos de minutos na tabela agenda_settings
-- Configurar valores padrão mais adequados para o sistema de 5 minutos
ALTER TABLE public.agenda_settings 
ALTER COLUMN email_reminder_1_minutes SET DEFAULT 60,
ALTER COLUMN email_reminder_2_minutes SET DEFAULT 15,
ALTER COLUMN whatsapp_reminder_1_minutes SET DEFAULT 60,
ALTER COLUMN whatsapp_reminder_2_minutes SET DEFAULT 15;

-- Comentário explicativo
COMMENT ON TABLE public.agenda_settings IS 
'Configurações da agenda com lembretes otimizados para execução a cada 5 minutos. Valores padrão: 60 min (1h antes) e 15 min (15 min antes)';