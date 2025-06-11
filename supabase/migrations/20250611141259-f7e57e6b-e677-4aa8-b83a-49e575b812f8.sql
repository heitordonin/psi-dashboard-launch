
-- Add phone_country_code to profiles and set default for existing users
ALTER TABLE public.profiles
ADD COLUMN phone_country_code TEXT NOT NULL DEFAULT '+55';
