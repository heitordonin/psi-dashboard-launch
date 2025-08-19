-- Add new field for therapist WhatsApp notifications to agenda_settings table
ALTER TABLE public.agenda_settings 
ADD COLUMN therapist_whatsapp_notifications boolean NOT NULL DEFAULT true;