-- Atualizar função get_churn_metrics para aceitar filtros de data
CREATE OR REPLACE FUNCTION public.get_churn_metrics(start_date date DEFAULT NULL, end_date date DEFAULT NULL)
 RETURNS TABLE(monthly_churn_rate numeric, total_cancellations_30_days bigint, retention_rate numeric, active_subscribers bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH churn_data AS (
    SELECT 
      -- Cancelamentos no período especificado (todos os planos pagos)
      COUNT(*) FILTER (
        WHERE us.status = 'cancelled' 
        AND ($1 IS NULL OR us.updated_at::date >= $1)
        AND ($2 IS NULL OR us.updated_at::date <= $2)
        AND sp.slug != 'free'
      ) as cancellations,
      
      -- Assinantes ativos atuais (apenas planos pagos)
      COUNT(*) FILTER (
        WHERE us.status = 'active' 
        AND sp.slug != 'free'
        AND (us.expires_at IS NULL OR us.expires_at > now())
      ) as active_subs,
      
      -- Base para cálculo de churn: assinantes que estavam ativos no início do período
      COUNT(*) FILTER (
        WHERE sp.slug != 'free'
        AND us.starts_at <= COALESCE($1, now() - interval '30 days')
        AND (
          us.status = 'active' 
          OR (us.status = 'cancelled' AND us.updated_at >= COALESCE($1, now() - interval '30 days'))
        )
      ) as base_subs_period_start
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
  )
  SELECT 
    -- Taxa de churn no período
    CASE 
      WHEN cd.base_subs_period_start > 0 THEN 
        ROUND((cd.cancellations::numeric / cd.base_subs_period_start::numeric) * 100, 2)
      ELSE 0 
    END as monthly_churn_rate,
    
    cd.cancellations as total_cancellations_30_days,
    
    -- Taxa de retenção (inverso do churn)
    CASE 
      WHEN cd.base_subs_period_start > 0 THEN 
        ROUND(((cd.base_subs_period_start - cd.cancellations)::numeric / cd.base_subs_period_start::numeric) * 100, 2)
      ELSE 100 
    END as retention_rate,
    
    cd.active_subs as active_subscribers
  FROM churn_data cd;
$function$

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