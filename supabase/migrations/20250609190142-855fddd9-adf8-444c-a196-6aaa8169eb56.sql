
-- Corrigir a função get_user_patient_limit para verificar corretamente o plano ativo
CREATE OR REPLACE FUNCTION public.get_user_patient_limit(user_id uuid DEFAULT auth.uid())
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_name text;
  patient_limit integer;
BEGIN
  -- Buscar o nome do plano ativo do usuário
  SELECT sp.name INTO plan_name
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = $1 
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > now());
  
  -- Definir limite baseado no nome do plano
  CASE plan_name
    WHEN 'Freemium' THEN
      patient_limit := 3;
    WHEN 'Básico' THEN
      patient_limit := 50;
    WHEN 'Pro' THEN
      patient_limit := 200;
    ELSE
      patient_limit := 3; -- Fallback para plano não encontrado
  END CASE;
  
  RETURN patient_limit;
END;
$function$
