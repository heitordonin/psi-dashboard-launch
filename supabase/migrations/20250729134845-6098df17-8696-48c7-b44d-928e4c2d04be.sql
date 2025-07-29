-- Add agenda_module_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN agenda_module_enabled boolean NOT NULL DEFAULT true;