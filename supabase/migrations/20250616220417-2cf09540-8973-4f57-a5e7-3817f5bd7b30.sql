
-- =================================================================
-- SECURITY MIGRATION: CREATE RPC TO FETCH DECRYPTED PROFILE
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_decrypted_profile()
RETURNS SETOF public.profiles AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    created_at,
    updated_at,
    full_name,
    display_name,
    -- Decrypt the sensitive fields for display.
    -- If the encrypted value is NULL, decrypt_value will also return NULL.
    public.decrypt_value(cpf_encrypted) AS cpf,
    public.decrypt_value(phone_encrypted) AS phone,
    birth_date,
    crp_number,
    nit_nis_pis,
    pagarme_recipient_id,
    is_admin,
    phone_verified,
    email_reminders_enabled,
    phone_country_code,
    street,
    street_number,
    complement,
    neighborhood,
    city,
    state,
    zip_code,
    -- Return the encrypted columns as NULL in this view to avoid exposing them.
    NULL::text AS cpf_encrypted,
    NULL::text AS phone_encrypted
  FROM
    public.profiles
  WHERE
    id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment for future clarity.
COMMENT ON FUNCTION public.get_decrypted_profile() IS 'Returns the profile of the currently authenticated user with sensitive fields decrypted for display purposes only.';
