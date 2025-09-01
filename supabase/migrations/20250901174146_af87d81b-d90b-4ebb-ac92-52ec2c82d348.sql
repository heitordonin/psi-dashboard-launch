-- Corrigir a função get_user_patient_limit para considerar concessões de cortesia
CREATE OR REPLACE FUNCTION public.get_user_patient_limit(user_id uuid DEFAULT auth.uid())
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_override_plan_slug TEXT;
  v_max_patients INTEGER;
BEGIN
  -- Primeiro verificar se existe concessão ativa
  SELECT plan_slug INTO v_override_plan_slug
  FROM public.get_active_subscription_override(user_id);
  
  -- Se existe concessão ativa, usar o plano da concessão
  IF v_override_plan_slug IS NOT NULL THEN
    SELECT sp.max_patients INTO v_max_patients
    FROM public.subscription_plans sp
    WHERE sp.slug = v_override_plan_slug AND sp.is_active = true;
    
    -- Se encontrou o plano da concessão
    IF v_max_patients IS NOT NULL THEN
      -- Se max_patients é null, tratar como ilimitado (999999)
      RETURN COALESCE(v_max_patients, 999999);
    END IF;
  END IF;
  
  -- Se não há concessão, verificar assinatura ativa normal
  SELECT sp.max_patients INTO v_max_patients
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = $1 
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > now())
  LIMIT 1;
  
  -- Retornar limite do plano ou fallback para 3
  RETURN COALESCE(v_max_patients, 3);
END;
$function$