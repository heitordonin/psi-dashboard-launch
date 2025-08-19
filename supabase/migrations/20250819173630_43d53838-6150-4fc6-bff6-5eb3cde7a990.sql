-- Migration 2: Message Type Enum (Corrigida)

-- 1) Backfill primeiro (comparação com texto)
UPDATE public.whatsapp_logs
SET message_type = 'text'
WHERE message_type IS NULL
   OR message_type::text NOT IN ('text','payment_reminder','appointment_reminder','otp');

-- 2) Cria enum se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_message_type') THEN
    CREATE TYPE whatsapp_message_type AS ENUM (
      'text', 'payment_reminder', 'appointment_reminder', 'otp'
    );
  END IF;
END$$;

-- 3) Remove CHECK antigo primeiro, se houver
ALTER TABLE public.whatsapp_logs
  DROP CONSTRAINT IF EXISTS whatsapp_logs_message_type_check;

-- 4) Altera coluna para enum com fallback seguro
ALTER TABLE public.whatsapp_logs
  ALTER COLUMN message_type TYPE whatsapp_message_type
    USING (CASE
             WHEN message_type::text IN ('text','payment_reminder','appointment_reminder','otp')
               THEN message_type::text::whatsapp_message_type
             ELSE 'text'::whatsapp_message_type
           END);

-- 5) Define default e NOT NULL
ALTER TABLE public.whatsapp_logs
  ALTER COLUMN message_type SET DEFAULT 'text'::whatsapp_message_type,
  ALTER COLUMN message_type SET NOT NULL;