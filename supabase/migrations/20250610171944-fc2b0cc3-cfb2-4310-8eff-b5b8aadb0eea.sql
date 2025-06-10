
-- Add phone_verified column to profiles table
ALTER TABLE public.profiles
ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT false;
