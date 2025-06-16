
-- =============================================
-- SECURITY MIGRATION: SECURE ENCRYPTION KEY WITH VAULT
-- =============================================

-- Step 1: Create a secure wrapper function to get the key from the vault.
-- This uses the Supabase-provided vault schema to access secrets.
CREATE OR REPLACE FUNCTION public.get_encryption_key()
RETURNS TEXT AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ENCRYPTION_KEY';
$$ LANGUAGE sql STABLE;

-- Step 2: Re-create the encryption function to use the new key getter.
-- Now, the key is no longer hardcoded.
CREATE OR REPLACE FUNCTION public.encrypt_value(value_to_encrypt TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT := public.get_encryption_key();
BEGIN
  IF value_to_encrypt IS NULL OR value_to_encrypt = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(
    pgp_sym_encrypt(
      value_to_encrypt,
      encryption_key
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Re-create the decryption function to use the new key getter.
CREATE OR REPLACE FUNCTION public.decrypt_value(value_to_decrypt TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT := public.get_encryption_key();
BEGIN
  IF value_to_decrypt IS NULL OR value_to_decrypt = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(
    decode(value_to_decrypt, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails (e.g., for data that was not encrypted), return NULL.
    -- This is safer than returning the encrypted gibberish.
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update comments to reflect the new secure implementation
COMMENT ON FUNCTION public.get_encryption_key() IS 'Securely retrieves the encryption key from Supabase Vault. Used by encrypt/decrypt functions.';
COMMENT ON FUNCTION public.encrypt_value(TEXT) IS 'Encrypts a text value using PGP symmetric encryption with key from Vault. Returns base64 encoded result.';
COMMENT ON FUNCTION public.decrypt_value(TEXT) IS 'Decrypts a PGP encrypted base64 text value using key from Vault. Returns NULL if decryption fails.';
