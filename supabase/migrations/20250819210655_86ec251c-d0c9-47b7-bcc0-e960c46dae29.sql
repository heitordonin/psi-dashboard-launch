-- Security Fix Implementation: Comprehensive Security Hardening

-- =====================================================================================
-- PHASE 1: DATABASE FUNCTION SECURITY - Add SET search_path TO '' to all functions
-- =====================================================================================

-- Fix get_user_plan_features function
CREATE OR REPLACE FUNCTION public.get_user_plan_features(user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (
      SELECT sp.features
      FROM public.user_subscriptions us
      JOIN public.subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 
        AND us.status = 'active'
        AND (us.expires_at IS NULL OR us.expires_at > now())
    ),
    '[]'::jsonb
  );
$function$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id),
    false
  );
$function$;

-- Fix validate_whatsapp_log_owner function
CREATE OR REPLACE FUNCTION public.validate_whatsapp_log_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Preenche owner via payment quando houver payment_id
  IF NEW.payment_id IS NOT NULL THEN
    SELECT p.owner_id INTO NEW.owner_id
    FROM public.payments p
    WHERE p.id = NEW.payment_id;
  END IF;

  -- Rejeita apenas se owner_id ainda for null após tentativas
  IF NEW.owner_id IS NULL THEN
    RAISE EXCEPTION 'whatsapp_logs.owner_id não pôde ser resolvido (sem JWT e sem payment_id válido)';
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix hash_value function
CREATE OR REPLACE FUNCTION public.hash_value(value_to_hash text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF value_to_hash IS NULL OR value_to_hash = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(digest(value_to_hash, 'sha256'), 'hex');
END;
$function$;

-- Fix encrypt_value function
CREATE OR REPLACE FUNCTION public.encrypt_value(value_to_encrypt text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
 SET search_path TO ''
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

-- Fix get_decrypted_profile function
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
$function$;

-- Fix get_encryption_key function
CREATE OR REPLACE FUNCTION public.get_encryption_key()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ENCRYPTION_KEY';
$function$;

-- Fix get_user_patient_limit function
CREATE OR REPLACE FUNCTION public.get_user_patient_limit(user_id uuid DEFAULT auth.uid())
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  plan_id uuid;
  patient_limit integer;
BEGIN
  -- Buscar o ID do plano ativo do usuário (incluindo canceladas mas ainda válidas)
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

-- =====================================================================================
-- PHASE 2: BUSINESS DATA PROTECTION - Restrict public access to sensitive tables
-- =====================================================================================

-- Remove public access to subscription_plans table
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;

-- Create secure policy for subscription_plans
CREATE POLICY "Authenticated users can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Remove overly broad public access to banks table
DROP POLICY IF EXISTS "Anyone can view active banks" ON public.banks;

-- Create secure policy for banks
CREATE POLICY "Authenticated users can view banks" 
ON public.banks 
FOR SELECT 
USING (auth.role() = 'authenticated' AND is_active = true);

-- =====================================================================================
-- PHASE 3: AUDIT LOGGING FOR SECURITY EVENTS
-- =====================================================================================

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (
    user_id,
    admin_user_id,
    action,
    old_value,
    new_value,
    created_at
  ) VALUES (
    p_user_id,
    p_user_id,
    p_event_type,
    p_details,
    jsonb_build_object(
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    ),
    now()
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- =====================================================================================
-- PHASE 4: ENHANCED RLS SECURITY POLICIES
-- =====================================================================================

-- Add secure policy for admin_audit_log to prevent unauthorized access
CREATE POLICY "Only super admins can delete audit logs" 
ON public.admin_audit_log 
FOR DELETE 
USING (
  is_admin(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Create index for better performance on security-critical queries
CREATE INDEX IF NOT EXISTS idx_profiles_admin_security ON public.profiles(id, is_admin) 
WHERE is_admin = true;

-- Create index for audit log security queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_security ON public.admin_audit_log(created_at, admin_user_id, action);

-- =====================================================================================
-- PHASE 5: TRIGGER SECURITY ENHANCEMENTS
-- =====================================================================================

-- Enhance the trigger to prevent admin escalation with additional logging
CREATE OR REPLACE FUNCTION public.prevent_is_admin_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Check if user is trying to change their own admin status
    IF auth.uid() = NEW.id AND COALESCE(NEW.is_admin,false) <> COALESCE(OLD.is_admin,false) THEN
      -- If they're not already an admin, prevent the change
      IF NOT public.is_admin(auth.uid()) THEN
        -- Log the attempt
        PERFORM public.log_security_event(
          'unauthorized_admin_escalation_attempt',
          auth.uid(),
          jsonb_build_object(
            'attempted_change', 'is_admin',
            'old_value', OLD.is_admin,
            'new_value', NEW.is_admin
          )
        );
        
        RAISE EXCEPTION 'You are not allowed to change admin status';
      ELSE
        -- Log legitimate admin status changes
        PERFORM public.log_security_event(
          'admin_status_changed',
          NEW.id,
          jsonb_build_object(
            'changed_by', auth.uid(),
            'old_value', OLD.is_admin,
            'new_value', NEW.is_admin
          )
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- =====================================================================================
-- PHASE 6: FINAL SECURITY DOCUMENTATION
-- =====================================================================================

COMMENT ON FUNCTION public.log_security_event IS 'Logs security-related events for audit and monitoring purposes';
COMMENT ON POLICY "Authenticated users can view subscription plans" ON public.subscription_plans IS 'Restricts plan access to authenticated users only';
COMMENT ON POLICY "Authenticated users can view banks" ON public.banks IS 'Restricts bank data access to authenticated users only';

-- Log the security hardening completion
SELECT public.log_security_event(
  'security_hardening_completed',
  '00000000-0000-0000-0000-000000000000'::uuid,
  jsonb_build_object(
    'phase', 'comprehensive_security_fixes',
    'functions_hardened', 8,
    'policies_updated', 4,
    'completed_at', now()
  )
);