
-- Criar enum para status dos agendamentos
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'no_show', 'cancelled');

-- Criar enum para tipos de lembrete
CREATE TYPE reminder_type AS ENUM ('email', 'whatsapp');

-- Criar enum para status dos lembretes
CREATE TYPE reminder_status AS ENUM ('sent', 'failed');

-- Tabela de configurações da agenda
CREATE TABLE public.agenda_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIME NOT NULL DEFAULT '08:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  session_duration INTEGER NOT NULL DEFAULT 50,
  working_days JSONB NOT NULL DEFAULT '[1,2,3,4,5]', -- Segunda a sexta por padrão
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  google_calendar_integration BOOLEAN NOT NULL DEFAULT false,
  google_calendar_id TEXT,
  email_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  email_reminder_minutes INTEGER DEFAULT 60,
  whatsapp_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  whatsapp_reminder_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  patient_name TEXT,
  patient_email TEXT,
  patient_phone TEXT,
  send_email_reminder BOOLEAN NOT NULL DEFAULT false,
  send_whatsapp_reminder BOOLEAN NOT NULL DEFAULT false,
  email_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  whatsapp_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  google_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de lembretes enviados
CREATE TABLE public.appointment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type reminder_type NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status reminder_status NOT NULL DEFAULT 'sent',
  error_message TEXT
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.agenda_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para agenda_settings
CREATE POLICY "Users can view their own agenda settings" 
  ON public.agenda_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agenda settings" 
  ON public.agenda_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agenda settings" 
  ON public.agenda_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all agenda settings" 
  ON public.agenda_settings 
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Políticas RLS para appointments
CREATE POLICY "Users can view their own appointments" 
  ON public.appointments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" 
  ON public.appointments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
  ON public.appointments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" 
  ON public.appointments 
  FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all appointments" 
  ON public.appointments 
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Políticas RLS para appointment_reminders
CREATE POLICY "Users can view their appointment reminders" 
  ON public.appointment_reminders 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.id = appointment_reminders.appointment_id 
      AND appointments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their appointment reminders" 
  ON public.appointment_reminders 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.id = appointment_reminders.appointment_id 
      AND appointments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all appointment reminders" 
  ON public.appointment_reminders 
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agenda_settings_updated_at
  BEFORE UPDATE ON public.agenda_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_start_datetime ON public.appointments(start_datetime);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointment_reminders_appointment_id ON public.appointment_reminders(appointment_id);
