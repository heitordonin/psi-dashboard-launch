
-- =================================================================
-- SECURITY MIGRATION: ADD ENCRYPTED COLUMNS TO PROFILES TABLE
-- =================================================================

-- Add a column to store the encrypted CPF.
-- It's of type TEXT because our encryption function returns a base64 string.
ALTER TABLE public.profiles
ADD COLUMN cpf_encrypted TEXT;

-- Add a column to store the encrypted phone number.
ALTER TABLE public.profiles
ADD COLUMN phone_encrypted TEXT;

-- Add comments for future clarity and documentation.
COMMENT ON COLUMN public.profiles.cpf_encrypted IS 'Stores the pgcrypto encrypted version of the user''s CPF.';
COMMENT ON COLUMN public.profiles.phone_encrypted IS 'Stores the pgcrypto encrypted version of the user''s phone number.';
