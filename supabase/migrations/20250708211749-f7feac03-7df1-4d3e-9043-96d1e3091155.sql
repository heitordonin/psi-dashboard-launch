-- Add address columns to patients table
ALTER TABLE public.patients
ADD COLUMN zip_code TEXT,
ADD COLUMN street TEXT,
ADD COLUMN street_number TEXT,
ADD COLUMN complement TEXT,
ADD COLUMN neighborhood TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT;