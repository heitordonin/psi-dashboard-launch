-- Sistema de monitoramento para lembretes automáticos

-- Tabela para métricas de execução
CREATE TABLE IF NOT EXISTS public.appointment_reminder_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  duration_ms integer,
  status text NOT NULL DEFAULT 'running', -- running, success, error, timeout
  total_reminders integer DEFAULT 0,
  successful_reminders integer DEFAULT 0,
  failed_reminders integer DEFAULT 0,
  rate_limited_reminders integer DEFAULT 0,
  error_message text,
  performance_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para logs estruturados
CREATE TABLE IF NOT EXISTS public.appointment_reminder_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id text NOT NULL,
  log_level text NOT NULL DEFAULT 'info', -- debug, info, warn, error, critical
  message text NOT NULL,
  context jsonb DEFAULT '{}',
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  appointment_id uuid,
  user_id uuid,
  reminder_type text, -- email, whatsapp
  error_details jsonb
);

-- Tabela para alertas de falhas críticas
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL, -- critical_failure, high_error_rate, performance_degradation
  severity text NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  title text NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active', -- active, acknowledged, resolved
  triggered_at timestamp with time zone NOT NULL DEFAULT now(),
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  execution_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reminder_metrics_execution_id ON public.appointment_reminder_metrics (execution_id);
CREATE INDEX IF NOT EXISTS idx_reminder_metrics_started_at ON public.appointment_reminder_metrics (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminder_metrics_status ON public.appointment_reminder_metrics (status);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_execution_id ON public.appointment_reminder_logs (execution_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_level_timestamp ON public.appointment_reminder_logs (log_level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_appointment_id ON public.appointment_reminder_logs (appointment_id);

CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON public.system_alerts (status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity_triggered ON public.system_alerts (severity, triggered_at DESC);

-- RLS Policies
ALTER TABLE public.appointment_reminder_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todas as métricas e logs
CREATE POLICY "Admins can manage all reminder metrics" ON public.appointment_reminder_metrics
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all reminder logs" ON public.appointment_reminder_logs
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all system alerts" ON public.system_alerts
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Função para registrar métricas de execução
CREATE OR REPLACE FUNCTION public.log_reminder_execution_metrics(
  p_execution_id text,
  p_status text,
  p_duration_ms integer DEFAULT NULL,
  p_total_reminders integer DEFAULT 0,
  p_successful_reminders integer DEFAULT 0,
  p_failed_reminders integer DEFAULT 0,
  p_rate_limited_reminders integer DEFAULT 0,
  p_error_message text DEFAULT NULL,
  p_performance_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_metric_id uuid;
BEGIN
  -- Inserir ou atualizar métricas
  INSERT INTO public.appointment_reminder_metrics (
    execution_id,
    status,
    completed_at,
    duration_ms,
    total_reminders,
    successful_reminders,
    failed_reminders,
    rate_limited_reminders,
    error_message,
    performance_data
  )
  VALUES (
    p_execution_id,
    p_status,
    CASE WHEN p_status != 'running' THEN now() ELSE NULL END,
    p_duration_ms,
    p_total_reminders,
    p_successful_reminders,
    p_failed_reminders,
    p_rate_limited_reminders,
    p_error_message,
    p_performance_data
  )
  ON CONFLICT (execution_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    completed_at = EXCLUDED.completed_at,
    duration_ms = EXCLUDED.duration_ms,
    total_reminders = EXCLUDED.total_reminders,
    successful_reminders = EXCLUDED.successful_reminders,
    failed_reminders = EXCLUDED.failed_reminders,
    rate_limited_reminders = EXCLUDED.rate_limited_reminders,
    error_message = EXCLUDED.error_message,
    performance_data = EXCLUDED.performance_data
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$;

-- Função para log estruturado
CREATE OR REPLACE FUNCTION public.log_reminder_event(
  p_execution_id text,
  p_level text,
  p_message text,
  p_context jsonb DEFAULT '{}',
  p_appointment_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_reminder_type text DEFAULT NULL,
  p_error_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.appointment_reminder_logs (
    execution_id,
    log_level,
    message,
    context,
    appointment_id,
    user_id,
    reminder_type,
    error_details
  )
  VALUES (
    p_execution_id,
    p_level,
    p_message,
    p_context,
    p_appointment_id,
    p_user_id,
    p_reminder_type,
    p_error_details
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Função para criar alertas críticos
CREATE OR REPLACE FUNCTION public.create_system_alert(
  p_alert_type text,
  p_severity text,
  p_title text,
  p_message text,
  p_details jsonb DEFAULT '{}',
  p_execution_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_alert_id uuid;
BEGIN
  INSERT INTO public.system_alerts (
    alert_type,
    severity,
    title,
    message,
    details,
    execution_id
  )
  VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_message,
    p_details,
    p_execution_id
  )
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$;

-- View para métricas agregadas
CREATE OR REPLACE VIEW public.appointment_reminder_metrics_summary AS
SELECT 
  DATE(started_at) as execution_date,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'success') as successful_executions,
  COUNT(*) FILTER (WHERE status = 'error') as failed_executions,
  AVG(duration_ms) as avg_duration_ms,
  SUM(total_reminders) as total_reminders_sent,
  SUM(successful_reminders) as total_successful_reminders,
  SUM(failed_reminders) as total_failed_reminders,
  SUM(rate_limited_reminders) as total_rate_limited_reminders,
  ROUND(AVG(CASE 
    WHEN total_reminders > 0 
    THEN (successful_reminders::numeric / total_reminders::numeric) * 100 
    ELSE 0 
  END), 2) as success_rate_percentage
FROM public.appointment_reminder_metrics
GROUP BY DATE(started_at)
ORDER BY execution_date DESC;

-- Constraint única para execution_id
ALTER TABLE public.appointment_reminder_metrics 
ADD CONSTRAINT unique_execution_id UNIQUE (execution_id);

COMMENT ON TABLE public.appointment_reminder_metrics IS 
'Métricas de execução do sistema de lembretes automáticos';

COMMENT ON TABLE public.appointment_reminder_logs IS 
'Logs estruturados para debugging do sistema de lembretes';

COMMENT ON TABLE public.system_alerts IS 
'Alertas de falhas críticas do sistema';