-- First, let's add a cancel_at_period_end field to track cancellation intent
ALTER TABLE public.user_subscriptions 
ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

-- Update the atomic_cancel_subscription function to handle proper cancellation logic
CREATE OR REPLACE FUNCTION public.atomic_cancel_subscription(p_user_id uuid, p_immediate boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_count INTEGER := 0;
  v_free_plan_id UUID;
  v_result jsonb;
BEGIN
  -- Lock user para evitar race conditions
  PERFORM 1 FROM auth.users WHERE id = p_user_id FOR UPDATE;
  
  IF p_immediate THEN
    -- Cancelamento imediato: cancelar e atribuir plano gratuito
    SELECT id INTO v_free_plan_id 
    FROM public.subscription_plans 
    WHERE slug = 'free' AND is_active = true;
    
    IF v_free_plan_id IS NULL THEN
      RAISE EXCEPTION 'Free plan not found';
    END IF;
    
    -- Usar função atômica para cancelar e inserir plano gratuito
    SELECT atomic_cancel_and_insert_subscription(
      p_user_id,
      v_free_plan_id,
      NULL, -- stripe_customer_id
      NULL, -- subscription_tier
      NULL, -- subscription_end
      false -- subscribed
    ) INTO v_result;
    
    v_result := v_result || jsonb_build_object(
      'message', 'Assinatura cancelada imediatamente. Você foi movido para o plano gratuito.',
      'immediate', true
    );
  ELSE
    -- Cancelamento no final do período: marcar para cancelar mas manter ativo
    UPDATE public.user_subscriptions 
    SET 
      cancel_at_period_end = true,
      updated_at = now()
    WHERE 
      user_id = p_user_id 
      AND status = 'active'
      AND cancel_at_period_end = false;
      
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- Log da operação
    INSERT INTO public.admin_audit_log (
      user_id,
      admin_user_id,
      action,
      old_value,
      new_value
    ) VALUES (
      p_user_id,
      p_user_id,
      'subscription_cancelled_at_period_end',
      jsonb_build_object('updated_count', v_updated_count),
      jsonb_build_object('immediate', false, 'cancel_at_period_end', true)
    );
    
    v_result := jsonb_build_object(
      'success', true,
      'updated_count', v_updated_count,
      'message', 'Assinatura cancelada. Você terá acesso até o final do período de cobrança.',
      'immediate', false
    );
  END IF;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Atomic subscription cancellation failed: %', SQLERRM;
END;
$function$;

-- Update get_user_plan_features to consider cancelled but still active subscriptions
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

-- Update get_user_patient_limit to consider cancelled but still active subscriptions
CREATE OR REPLACE FUNCTION public.get_user_patient_limit(user_id uuid DEFAULT auth.uid())
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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