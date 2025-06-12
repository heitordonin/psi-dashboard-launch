
-- Update the intermediate plan to become the "Gestão" plan
UPDATE public.subscription_plans
SET
  name = 'Gestão',
  slug = 'gestao',
  price_monthly = 8900,  -- R$89,00 in cents
  price_yearly = 7120    -- R$71,20 in cents (annual discount)
WHERE
  slug = 'basic';

-- Update the prices for the "Psi Regular" plan
UPDATE public.subscription_plans
SET
  price_monthly = 38900, -- R$389,00 in cents
  price_yearly = 29175   -- R$291,75 in cents (annual discount)
WHERE
  slug = 'psi_regular';

-- Update the patient limit function to use the new slug
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
    WHEN (SELECT id FROM public.subscription_plans WHERE slug = 'gratis' LIMIT 1) THEN
      patient_limit := 3;
    WHEN (SELECT id FROM public.subscription_plans WHERE slug = 'gestao' LIMIT 1) THEN
      patient_limit := 50;
    WHEN (SELECT id FROM public.subscription_plans WHERE slug = 'psi_regular' LIMIT 1) THEN
      patient_limit := 200;
    ELSE
      patient_limit := 3; -- Fallback para plano não encontrado
  END CASE;
  
  RETURN patient_limit;
END;
$function$
