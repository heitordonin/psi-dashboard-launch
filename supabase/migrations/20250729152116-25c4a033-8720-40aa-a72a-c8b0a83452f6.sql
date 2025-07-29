-- Fix the get_decrypted_profile function to return columns in exact table order
CREATE OR REPLACE FUNCTION public.get_decrypted_profile()
 RETURNS SETOF profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.created_at,
    p.updated_at,
    p.full_name,
    p.display_name,
    -- Decrypt CPF field
    CASE 
      WHEN p.cpf_encrypted IS NOT NULL THEN public.decrypt_value(p.cpf_encrypted)
      ELSE p.cpf
    END AS cpf,
    -- Decrypt phone field  
    CASE 
      WHEN p.phone_encrypted IS NOT NULL THEN public.decrypt_value(p.phone_encrypted)
      ELSE p.phone
    END AS phone,
    p.birth_date,
    p.crp_number,
    p.nit_nis_pis,
    p.pagarme_recipient_id,
    p.is_admin,
    p.phone_verified,
    p.agenda_module_enabled,
    p.email_reminders_enabled,
    p.phone_country_code,
    p.street,
    p.street_number,
    p.complement,
    p.neighborhood,
    p.city,
    p.state,
    p.zip_code,
    -- Return encrypted columns as NULL to avoid exposure
    NULL::text AS cpf_encrypted,
    NULL::text AS phone_encrypted
  FROM
    public.profiles p
  WHERE
    p.id = auth.uid();
END;
$function$