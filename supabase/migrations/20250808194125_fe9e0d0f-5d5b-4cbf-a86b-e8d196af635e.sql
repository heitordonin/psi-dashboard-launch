-- Criar tabela para controle idempotente de envios de lembretes
CREATE TABLE public.appointment_reminder_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('email', 'whatsapp')),
  time_bucket timestamp with time zone NOT NULL, -- Bucket de 5 minutos para idempotência
  delivery_status text NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'failed')),
  error_message text,
  recipient_contact text NOT NULL, -- email ou telefone
  content_hash text, -- hash do conteúdo para validação adicional
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Índice único para garantir idempotência: uma entrega por appointment+tipo+bucket
  CONSTRAINT unique_appointment_reminder_delivery 
    UNIQUE (appointment_id, reminder_type, time_bucket)
);

-- Habilitar RLS
ALTER TABLE public.appointment_reminder_deliveries ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios logs
CREATE POLICY "Users can view their own reminder deliveries"
ON public.appointment_reminder_deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE appointments.id = appointment_reminder_deliveries.appointment_id 
    AND appointments.user_id = auth.uid()
  )
);

-- Política para inserção (apenas pelo sistema)
CREATE POLICY "System can insert reminder deliveries"
ON public.appointment_reminder_deliveries
FOR INSERT
WITH CHECK (true);

-- Política para admins
CREATE POLICY "Admins can manage all reminder deliveries"
ON public.appointment_reminder_deliveries
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Função para calcular bucket de tempo (5 minutos)
CREATE OR REPLACE FUNCTION public.get_time_bucket_5min(input_time timestamp with time zone)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT date_trunc('hour', input_time) + 
         (EXTRACT(minute FROM input_time)::int / 5) * interval '5 minutes';
$$;

-- Função para verificar se um lembrete já foi enviado (idempotência)
CREATE OR REPLACE FUNCTION public.is_reminder_already_sent(
  p_appointment_id uuid,
  p_reminder_type text,
  p_current_time timestamp with time zone DEFAULT now()
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.appointment_reminder_deliveries
    WHERE appointment_id = p_appointment_id
      AND reminder_type = p_reminder_type
      AND time_bucket = public.get_time_bucket_5min(p_current_time)
      AND delivery_status = 'sent'
  );
$$;

-- Função para registrar envio de lembrete (idempotente)
CREATE OR REPLACE FUNCTION public.register_reminder_delivery(
  p_appointment_id uuid,
  p_reminder_type text,
  p_recipient_contact text,
  p_delivery_status text DEFAULT 'sent',
  p_error_message text DEFAULT NULL,
  p_content_hash text DEFAULT NULL,
  p_current_time timestamp with time zone DEFAULT now()
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_delivery_id uuid;
  v_time_bucket timestamp with time zone;
BEGIN
  v_time_bucket := public.get_time_bucket_5min(p_current_time);
  
  -- Tentar inserir, ignorando se já existe (idempotência)
  INSERT INTO public.appointment_reminder_deliveries (
    appointment_id,
    reminder_type,
    time_bucket,
    delivery_status,
    error_message,
    recipient_contact,
    content_hash
  )
  VALUES (
    p_appointment_id,
    p_reminder_type,
    v_time_bucket,
    p_delivery_status,
    p_error_message,
    p_recipient_contact,
    p_content_hash
  )
  ON CONFLICT (appointment_id, reminder_type, time_bucket) 
  DO NOTHING
  RETURNING id INTO v_delivery_id;
  
  -- Se não foi inserido (já existia), buscar o ID existente
  IF v_delivery_id IS NULL THEN
    SELECT id INTO v_delivery_id
    FROM public.appointment_reminder_deliveries
    WHERE appointment_id = p_appointment_id
      AND reminder_type = p_reminder_type
      AND time_bucket = v_time_bucket;
  END IF;
  
  RETURN v_delivery_id;
END;
$$;