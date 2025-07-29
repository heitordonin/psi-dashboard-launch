-- Atualizar função get_conversion_metrics para aceitar filtros de data
CREATE OR REPLACE FUNCTION public.get_conversion_metrics(start_date date DEFAULT NULL, end_date date DEFAULT NULL)
 RETURNS TABLE(free_to_paid_rate numeric, gestao_to_psi_regular_rate numeric, total_conversions_30_days bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH conversion_data AS (
    -- Usuários que fizeram upgrade de free para pago no período especificado
    SELECT 
      COUNT(*) FILTER (
        WHERE old_plan.slug = 'free' 
        AND new_plan.slug IN ('gestao', 'psi_regular')
        AND ($1 IS NULL OR us_new.created_at::date >= $1)
        AND ($2 IS NULL OR us_new.created_at::date <= $2)
      ) as free_to_paid_conversions,
      
      -- Usuários que fizeram upgrade de gestao para psi_regular no período especificado
      COUNT(*) FILTER (
        WHERE old_plan.slug = 'gestao' 
        AND new_plan.slug = 'psi_regular'
        AND ($1 IS NULL OR us_new.created_at::date >= $1)
        AND ($2 IS NULL OR us_new.created_at::date <= $2)
      ) as gestao_to_psi_conversions,
      
      -- Total de usuários free ativos (base para conversão)
      (SELECT COUNT(*) 
       FROM public.user_subscriptions us
       JOIN public.subscription_plans sp ON us.plan_id = sp.id
       WHERE sp.slug = 'free' AND us.status = 'active'
      ) as total_free_users,
      
      -- Total de usuários gestao ativos (base para upgrade)
      (SELECT COUNT(*) 
       FROM public.user_subscriptions us
       JOIN public.subscription_plans sp ON us.plan_id = sp.id
       WHERE sp.slug = 'gestao' AND us.status = 'active'
      ) as total_gestao_users
      
    FROM public.user_subscriptions us_new
    JOIN public.subscription_plans new_plan ON us_new.plan_id = new_plan.id
    -- Buscar assinatura anterior do mesmo usuário
    LEFT JOIN public.user_subscriptions us_old ON (
      us_old.user_id = us_new.user_id 
      AND us_old.created_at < us_new.created_at
      AND us_old.status = 'cancelled'
    )
    LEFT JOIN public.subscription_plans old_plan ON us_old.plan_id = old_plan.id
    WHERE ($1 IS NULL OR us_new.created_at::date >= $1)
      AND ($2 IS NULL OR us_new.created_at::date <= $2)
  )
  SELECT 
    -- Taxa de conversão free para pago
    CASE 
      WHEN cd.total_free_users > 0 THEN 
        ROUND((cd.free_to_paid_conversions::numeric / cd.total_free_users::numeric) * 100, 2)
      ELSE 0 
    END as free_to_paid_rate,
    
    -- Taxa de upgrade gestao para psi_regular
    CASE 
      WHEN cd.total_gestao_users > 0 THEN 
        ROUND((cd.gestao_to_psi_conversions::numeric / cd.total_gestao_users::numeric) * 100, 2)
      ELSE 0 
    END as gestao_to_psi_regular_rate,
    
    -- Total de conversões no período especificado
    (cd.free_to_paid_conversions + cd.gestao_to_psi_conversions) as total_conversions_30_days
    
  FROM conversion_data cd;
$function$