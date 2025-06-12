
-- Add address columns to profiles table for Pagar.me integration
ALTER TABLE public.profiles
ADD COLUMN street TEXT,
ADD COLUMN street_number TEXT,
ADD COLUMN complement TEXT,
ADD COLUMN neighborhood TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN zip_code TEXT;
