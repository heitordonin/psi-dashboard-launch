-- Fix database function security by adding search_path protection
-- This prevents SQL injection attacks through search_path manipulation

-- Fix get_user_plan_features function
CREATE OR REPLACE FUNCTION public.get_user_plan_features(user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id),
    false
  );
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

-- Secure admin access control - prevent users from updating their own is_admin status
DROP POLICY IF EXISTS "Users can update own profile except is_admin" ON public.profiles;

CREATE POLICY "Users cannot update admin status" ON public.profiles
FOR UPDATE
USING (auth.uid() = id AND (is_admin IS NULL OR is_admin = false))
WITH CHECK (auth.uid() = id AND COALESCE(NEW.is_admin, false) = COALESCE(OLD.is_admin, false));

-- Reduce OTP expiry time from 5 minutes to 2 minutes for better security
ALTER TABLE public.phone_verification_codes 
ALTER COLUMN expires_at SET DEFAULT (now() + '00:02:00'::interval);

-- Create audit log table for admin privilege changes
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_log
FOR INSERT
WITH CHECK (is_admin(auth.uid()));