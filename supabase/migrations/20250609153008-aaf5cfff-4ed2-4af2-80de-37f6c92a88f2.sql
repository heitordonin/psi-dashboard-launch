
-- Adicionar campo de opt-in para lembretes por email na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN email_reminders_enabled boolean NOT NULL DEFAULT false;

-- Adicionar campo para rastrear quando o último lembrete foi enviado
ALTER TABLE public.payments 
ADD COLUMN email_reminder_sent_at timestamp with time zone;

-- Criar tabela para logs de emails (opcional, mas útil para auditoria)
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  email_type text NOT NULL DEFAULT 'payment_reminder',
  subject text,
  content text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamp with time zone DEFAULT now(),
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas seus próprios logs de email
CREATE POLICY "Users can view their own email logs" 
  ON public.email_logs 
  FOR SELECT 
  USING (auth.uid() = owner_id);

-- Política para que usuários criem apenas seus próprios logs de email
CREATE POLICY "Users can create their own email logs" 
  ON public.email_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

-- Comentário sobre as tabelas WhatsApp (mantendo inativas conforme solicitado)
COMMENT ON TABLE public.whatsapp_logs IS 'Tabela inativa - WhatsApp funcionalidade em pausa para MVP';
COMMENT ON TABLE public.whatsapp_templates IS 'Tabela inativa - WhatsApp funcionalidade em pausa para MVP';
