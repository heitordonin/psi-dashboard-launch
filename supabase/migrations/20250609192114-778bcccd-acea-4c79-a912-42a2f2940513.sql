
-- Corrigir a função get_user_patient_limit para usar os slugs corretos
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
$function$
