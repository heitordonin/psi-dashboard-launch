
-- =============================================
-- SECURITY MIGRATION: SETUP BASIC ENCRYPTION FUNCTIONS
-- =============================================

-- Since pgsodium is not available, we'll create basic encryption functions
-- using PostgreSQL's built-in crypto functions with pgcrypto extension

-- Step 1: Enable the pgcrypto extension (standard in most PostgreSQL installations)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Create a function to encrypt a text value using AES encryption
-- This provides basic encryption for sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_value(value_to_encrypt TEXT)
RETURNS TEXT AS $$
DECLARE
  -- Using a fixed encryption key for now (should be moved to Vault in production)
  encryption_key TEXT := 'psiclo_encryption_key_2024_secure_long_enough_key';
BEGIN
  -- Return NULL if input is NULL or empty
  IF value_to_encrypt IS NULL OR value_to_encrypt = '' THEN
    RETURN NULL;
  END IF;
  
  -- Encrypt using AES with the key
  RETURN encode(
    encrypt_iv(
      value_to_encrypt::bytea,
      encryption_key::bytea,
      gen_random_bytes(16),
      'aes-cbc'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a function to decrypt an encrypted value
CREATE OR REPLACE FUNCTION public.decrypt_value(value_to_decrypt TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT := 'psiclo_encryption_key_2024_secure_long_enough_key';
BEGIN
  -- Return NULL if input is NULL or empty
  IF value_to_decrypt IS NULL OR value_to_decrypt = '' THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt using AES with the key
  RETURN convert_from(
    decrypt_iv(
      decode(value_to_decrypt, 'base64'),
      encryption_key::bytea,
      substring(decode(value_to_decrypt, 'base64') from 1 for 16),
      'aes-cbc'
    ),
    'utf8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return original value if decryption fails (for backward compatibility)
    RETURN value_to_decrypt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a simple hash function for data that needs to be searchable but not decryptable
CREATE OR REPLACE FUNCTION public.hash_value(value_to_hash TEXT)
RETURNS TEXT AS $$
BEGIN
  IF value_to_hash IS NULL OR value_to_hash = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(digest(value_to_hash, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Add comments to the functions for future reference
COMMENT ON FUNCTION public.encrypt_value(TEXT) IS 'Encrypts a text value using AES encryption with pgcrypto. For production, move encryption key to Supabase Vault.';
COMMENT ON FUNCTION public.decrypt_value(TEXT) IS 'Decrypts an AES encrypted text value. Includes fallback for backward compatibility.';
COMMENT ON FUNCTION public.hash_value(TEXT) IS 'Creates a SHA256 hash of a text value for searchable but non-reversible encryption.';
