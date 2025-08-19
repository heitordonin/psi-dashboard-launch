-- Migration 2: Message Type Enum

-- 1) Backfill (garante migração suave mesmo com dados inválidos preexistentes)
UPDATE public.whatsapp_logs
SET message_type = 'text'
WHERE message_type IS NULL
   OR message_type NOT IN ('text','payment_reminder','appointment_reminder','otp');

-- 2) Cria enum se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_message_type') THEN
    CREATE TYPE whatsapp_message_type AS ENUM (
      'text', 'payment_reminder', 'appointment_reminder', 'otp'
    );
  END IF;
END$$;

-- 3) Altera coluna para enum com fallback seguro
ALTER TABLE public.whatsapp_logs
  ALTER COLUMN message_type DROP DEFAULT,
  ALTER COLUMN message_type TYPE whatsapp_message_type
    USING (CASE
             WHEN message_type IN ('text','payment_reminder','appointment_reminder','otp')
               THEN message_type::whatsapp_message_type
             ELSE 'text'::whatsapp_message_type
           END),
  ALTER COLUMN message_type SET DEFAULT 'text',
  ALTER COLUMN message_type SET NOT NULL;

-- 4) Remove CHECK antigo, se houver
ALTER TABLE public.whatsapp_logs
  DROP CONSTRAINT IF EXISTS whatsapp_logs_message_type_check;