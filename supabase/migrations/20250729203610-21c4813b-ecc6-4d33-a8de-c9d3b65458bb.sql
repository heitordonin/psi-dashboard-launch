-- Configurar cron job para backup diário às 02:00 AM
-- Primeiro, garantir que as extensões necessárias estão habilitadas
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar backup diário às 02:00 AM (horário de Brasília)
SELECT cron.schedule(
  'daily-database-backup',
  '0 2 * * *', -- 02:00 todos os dias
  $$
  SELECT
    net.http_post(
        url:='https://xwaxvupymmlbehlocyzt.supabase.co/functions/v1/database-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YXh2dXB5bW1sYmVobG9jeXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzc1NzYsImV4cCI6MjA2NDU1MzU3Nn0.t3jxj74dZmzGzHiJJQL9-pgc2JT1KupqYma1JMMI8u8"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Criar tabela para monitorar status dos backups
CREATE TABLE IF NOT EXISTS public.backup_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_type text NOT NULL DEFAULT 'daily',
  filename text,
  file_size bigint,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  duration_ms bigint,
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Habilitar RLS na tabela backup_status
ALTER TABLE public.backup_status ENABLE ROW LEVEL SECURITY;

-- Permitir que apenas admins vejam os status dos backups
CREATE POLICY "Admins can view backup status" 
  ON public.backup_status 
  FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert backup status" 
  ON public.backup_status 
  FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update backup status" 
  ON public.backup_status 
  FOR UPDATE 
  USING (is_admin(auth.uid()));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_backup_status_created_at ON public.backup_status(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_status_type ON public.backup_status(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_status_status ON public.backup_status(status);