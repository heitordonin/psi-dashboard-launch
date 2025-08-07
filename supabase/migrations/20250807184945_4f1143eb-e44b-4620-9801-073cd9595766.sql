-- Add support for 2 email and 2 WhatsApp reminders
ALTER TABLE agenda_settings 
ADD COLUMN email_reminder_1_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN email_reminder_1_minutes integer DEFAULT 60,
ADD COLUMN email_reminder_2_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN email_reminder_2_minutes integer DEFAULT 15,
ADD COLUMN whatsapp_reminder_1_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN whatsapp_reminder_1_minutes integer DEFAULT 60,
ADD COLUMN whatsapp_reminder_2_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN whatsapp_reminder_2_minutes integer DEFAULT 15;