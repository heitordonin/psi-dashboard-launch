-- Remove o cron job duplicado que executa a cada minuto
SELECT cron.unschedule('send-automatic-appointment-reminders-every-minute');