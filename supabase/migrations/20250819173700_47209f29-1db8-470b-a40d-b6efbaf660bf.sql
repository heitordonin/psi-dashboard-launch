-- Migration 2: Message Type Enum (Simplificada)

-- 1) Backfill primeiro (garantindo todos os valores são válidos)
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

-- 3) Remove CHECK e default antigos
ALTER TABLE public.whatsapp_logs
  DROP CONSTRAINT IF EXISTS whatsapp_logs_message_type_check;

ALTER TABLE public.whatsapp_logs
  ALTER COLUMN message_type DROP DEFAULT;

-- 4) Altera tipo da coluna
ALTER TABLE public.whatsapp_logs
  ALTER COLUMN message_type TYPE whatsapp_message_type
    USING message_type::whatsapp_message_type;

-- 5) Recoloca default e NOT NULL
ALTER TABLE public.whatsapp_logs
  ALTER COLUMN message_type SET DEFAULT 'text'::whatsapp_message_type;

ALTER TABLE public.whatsapp_logs
  ALTER COLUMN message_type SET NOT NULL;