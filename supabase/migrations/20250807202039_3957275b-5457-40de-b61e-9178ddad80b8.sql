-- Índices para otimização da função de lembretes automáticos

-- Índice composto para appointments: otimiza query principal que filtra por status e start_datetime
CREATE INDEX IF NOT EXISTS idx_appointments_status_start_datetime 
ON public.appointments (status, start_datetime)
WHERE status = 'scheduled';

-- Índice para agenda_settings: otimiza JOIN com user_id
CREATE INDEX IF NOT EXISTS idx_agenda_settings_user_id 
ON public.agenda_settings (user_id);

-- Índice adicional para appointments.user_id para melhorar JOINs
CREATE INDEX IF NOT EXISTS idx_appointments_user_id 
ON public.appointments (user_id);

-- Índice para email_reminder_sent_at para verificação de lembretes já enviados
CREATE INDEX IF NOT EXISTS idx_appointments_email_reminder_sent_at 
ON public.appointments (email_reminder_sent_at)
WHERE email_reminder_sent_at IS NOT NULL;

-- Índice para whatsapp_reminder_sent_at para verificação de lembretes já enviados
CREATE INDEX IF NOT EXISTS idx_appointments_whatsapp_reminder_sent_at 
ON public.appointments (whatsapp_reminder_sent_at)
WHERE whatsapp_reminder_sent_at IS NOT NULL;

-- Índice para appointment_reminders para logs de falhas
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id_type
ON public.appointment_reminders (appointment_id, reminder_type, sent_at);

-- Comentários sobre os índices criados
COMMENT ON INDEX idx_appointments_status_start_datetime IS 
'Índice composto para otimizar queries que filtram appointments por status=scheduled e range de start_datetime';

COMMENT ON INDEX idx_agenda_settings_user_id IS 
'Índice para otimizar JOIN entre appointments e agenda_settings via user_id';

COMMENT ON INDEX idx_appointments_user_id IS 
'Índice para otimizar JOINs de appointments com outras tabelas via user_id';

COMMENT ON INDEX idx_appointment_reminders_appointment_id_type IS 
'Índice para otimizar consultas de logs de lembretes por appointment e tipo';