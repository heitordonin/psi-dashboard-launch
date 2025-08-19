-- Complete security hardening: Add SET search_path TO '' to remaining functions
-- and add RLS policies to missing tables

-- Fix remaining database functions that lack search path protection
CREATE OR REPLACE FUNCTION public.get_user_patient_limit(user_id uuid DEFAULT auth.uid())
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_plan_slug text;
  v_max_patients integer;
  v_override_plan_slug text;
BEGIN
  -- Check for active subscription override first
  SELECT plan_slug INTO v_override_plan_slug
  FROM public.get_active_subscription_override(user_id);
  
  -- Get plan slug (from override or regular subscription)
  IF v_override_plan_slug IS NOT NULL THEN
    v_plan_slug := v_override_plan_slug;
  ELSE
    SELECT sp.slug INTO v_plan_slug
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = $1 
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
    LIMIT 1;
  END IF;
  
  -- Get max patients for the plan
  SELECT max_patients INTO v_max_patients
  FROM public.subscription_plans
  WHERE slug = COALESCE(v_plan_slug, 'freemium')
    AND is_active = true;
  
  RETURN COALESCE(v_max_patients, 3); -- Default to 3 if not found
END;
$function$;

-- Create log_security_event function with proper security
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_severity text DEFAULT 'medium'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.admin_audit_log (
    user_id,
    admin_user_id,
    action,
    old_value,
    new_value
  ) VALUES (
    p_user_id,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    p_event_type,
    jsonb_build_object('severity', p_severity),
    p_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- Add RLS policies to appointment_reminder_metrics_summary table
ALTER TABLE public.appointment_reminder_metrics_summary ENABLE ROW LEVEL SECURITY;

-- Only admins can access appointment reminder metrics summary
CREATE POLICY "Admins can manage appointment reminder metrics summary"
ON public.appointment_reminder_metrics_summary
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Enhance admin escalation prevention with security logging
CREATE OR REPLACE FUNCTION public.prevent_admin_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Prevent non-admins from setting themselves as admin
  IF NEW.is_admin = true AND OLD.is_admin = false THEN
    IF NOT public.is_admin(auth.uid()) THEN
      -- Log security event
      PERFORM public.log_security_event(
        'unauthorized_admin_escalation_attempt',
        NEW.id,
        jsonb_build_object(
          'attempted_by', auth.uid(),
          'target_user', NEW.id,
          'timestamp', now()
        ),
        'high'
      );
      
      RAISE EXCEPTION 'Unauthorized attempt to escalate privileges';
    END IF;
  END IF;
  
  -- Log successful admin changes
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    PERFORM public.log_security_event(
      'admin_status_changed',
      NEW.id,
      jsonb_build_object(
        'changed_by', auth.uid(),
        'target_user', NEW.id,
        'old_admin_status', OLD.is_admin,
        'new_admin_status', NEW.is_admin,
        'timestamp', now()
      ),
      'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for admin escalation prevention
DROP TRIGGER IF EXISTS prevent_admin_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_admin_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_escalation();

-- Add performance indexes for security queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user_id ON public.admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

-- Add policy for secure audit log deletion (admin-only)
CREATE POLICY "Only super admins can delete audit logs"
ON public.admin_audit_log
FOR DELETE
TO authenticated
USING (
  public.is_admin(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);