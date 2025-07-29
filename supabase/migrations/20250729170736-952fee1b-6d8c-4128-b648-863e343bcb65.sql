-- Atualizar função get_ltv_metrics para aceitar filtros de data
CREATE OR REPLACE FUNCTION public.get_ltv_metrics(start_date date DEFAULT NULL, end_date date DEFAULT NULL)
 RETURNS TABLE(avg_ltv_gestao numeric, avg_ltv_psi_regular numeric, avg_subscription_duration_days numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH subscription_durations AS (
    SELECT 
      sp.slug,
      sp.price_monthly,
      CASE 
        WHEN us.status = 'cancelled' THEN 
          GREATEST(
            EXTRACT(EPOCH FROM (us.updated_at - us.starts_at)) / 86400,
            1 -- Mínimo de 1 dia para evitar divisão por zero
          )
        ELSE 
          GREATEST(
            EXTRACT(EPOCH FROM (now() - us.starts_at)) / 86400,
            1 -- Mínimo de 1 dia para evitar divisão por zero
          )
      END as duration_days
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE sp.slug IN ('gestao', 'psi_regular')
      AND us.starts_at IS NOT NULL
      -- Filtrar por período se especificado
      AND ($1 IS NULL OR us.starts_at::date >= $1)
      AND ($2 IS NULL OR us.starts_at::date <= $2)
      -- Filtrar assinaturas muito curtas (provavelmente testes)
      AND (
        (us.status = 'cancelled' AND us.updated_at > us.starts_at + interval '1 day')
        OR us.status = 'active'
      )
  )
  SELECT 
    -- LTV = (duração em meses) * preço mensal
    ROUND(AVG(
      CASE WHEN slug = 'gestao' THEN 
        (duration_days / 30.44) * price_monthly 
      ELSE NULL END
    ), 2) as avg_ltv_gestao,
    
    ROUND(AVG(
      CASE WHEN slug = 'psi_regular' THEN 
        (duration_days / 30.44) * price_monthly 
      ELSE NULL END
    ), 2) as avg_ltv_psi_regular,
    
    ROUND(AVG(duration_days), 0) as avg_subscription_duration_days
  FROM subscription_durations
  WHERE duration_days > 1; -- Filtrar assinaturas de teste
$function$