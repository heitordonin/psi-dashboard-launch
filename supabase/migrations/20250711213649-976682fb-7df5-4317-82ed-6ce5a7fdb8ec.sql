-- =================================================================
-- SECURITY FIX: Add search_path to SECURITY DEFINER functions
-- =================================================================

-- Fix validate_whatsapp_log_owner function
CREATE OR REPLACE FUNCTION public.validate_whatsapp_log_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se payment_id não for nulo, verificar se owner_id bate com o owner_id do payment
  IF NEW.payment_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.payments 
      WHERE id = NEW.payment_id 
      AND owner_id = NEW.owner_id
    ) THEN
      RAISE EXCEPTION 'Owner ID must match the payment owner ID';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix encrypt_value function
CREATE OR REPLACE FUNCTION public.encrypt_value(value_to_encrypt text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix decrypt_value function
CREATE OR REPLACE FUNCTION public.decrypt_value(value_to_decrypt text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix validate_due_date function
CREATE OR REPLACE FUNCTION public.validate_due_date()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only apply the date validation if the charge has a payment link.
  IF NEW.has_payment_link IS TRUE AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.due_date IS DISTINCT FROM NEW.due_date)) THEN
    -- If it's a link payment, the due date cannot be in the past.
    IF NEW.due_date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Due date must be today or in the future for payment links';
    END IF;
  END IF;
  
  -- For manual payments (has_payment_link is FALSE), the function will do nothing and allow the operation.
  RETURN NEW;
END;
$function$;

-- Fix hash_value function
CREATE OR REPLACE FUNCTION public.hash_value(value_to_hash text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF value_to_hash IS NULL OR value_to_hash = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(digest(value_to_hash, 'sha256'), 'hex');
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_full_name TEXT;
  user_cpf TEXT;
  user_phone_number TEXT;
  user_display_name TEXT;
BEGIN
  -- Defensive check for null metadata
  IF NEW.raw_user_meta_data IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Extract data from raw_user_meta_data using the new key
  user_full_name := NEW.raw_user_meta_data ->> 'full_name';
  user_cpf := NEW.raw_user_meta_data ->> 'cpf';
  user_phone_number := NEW.raw_user_meta_data ->> 'phone_number';
  
  -- Generate display_name from first name (first word of full_name)
  IF user_full_name IS NOT NULL THEN
    user_display_name := SPLIT_PART(user_full_name, ' ', 1);
  END IF;

  -- Insert with the corrected phone variable
  INSERT INTO public.profiles (
    id, full_name, cpf, phone, display_name, birth_date, crp_number, nit_nis_pis, updated_at
  )
  VALUES (
    NEW.id, user_full_name, user_cpf, user_phone_number, user_display_name, NULL, NULL, NULL, now()
  );
  
  RETURN NEW;
END;
$function$;

-- Fix assign_freemium_plan function
CREATE OR REPLACE FUNCTION public.assign_freemium_plan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_id, status)
  SELECT 
    NEW.id,
    sp.id,
    'active'
  FROM public.subscription_plans sp
  WHERE sp.slug = 'freemium'
  LIMIT 1;
  
  RETURN NEW;
END;
$function$;

-- Fix cleanup_expired_verification_codes function
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.phone_verification_codes 
  WHERE expires_at < now();
END;
$function$;

-- Fix get_decrypted_profile function
CREATE OR REPLACE FUNCTION public.get_decrypted_profile()
 RETURNS SETOF profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix get_user_patient_limit function
CREATE OR REPLACE FUNCTION public.get_user_patient_limit(user_id uuid DEFAULT auth.uid())
 RETURNS integer
 LANGUAGE plpgsql
 STABLE 
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_id uuid;
  patient_limit integer;
BEGIN
  -- Buscar o ID do plano ativo do usuário
  SELECT us.plan_id INTO plan_id
  FROM public.user_subscriptions us
  WHERE us.user_id = $1 
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > now());
  
  -- Definir limite baseado no ID do plano usando os slugs corretos
  CASE plan_id
    WHEN (SELECT id FROM public.subscription_plans WHERE slug = 'free' LIMIT 1) THEN
      patient_limit := 3;
    WHEN (SELECT id FROM public.subscription_plans WHERE slug = 'basic' LIMIT 1) THEN
      patient_limit := 50;
    WHEN (SELECT id FROM public.subscription_plans WHERE slug = 'psi_regular' LIMIT 1) THEN
      patient_limit := 200;
    ELSE
      patient_limit := 3; -- Fallback para plano não encontrado
  END CASE;
  
  RETURN patient_limit;
END;
$function$;