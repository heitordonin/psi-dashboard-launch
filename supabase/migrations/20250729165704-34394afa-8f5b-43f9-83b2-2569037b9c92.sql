-- Corrigir função get_churn_metrics para cálculo mais preciso
CREATE OR REPLACE FUNCTION public.get_churn_metrics()
 RETURNS TABLE(monthly_churn_rate numeric, total_cancellations_30_days bigint, retention_rate numeric, active_subscribers bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH churn_data AS (
    SELECT 
      -- Cancelamentos nos últimos 30 dias (todos os planos pagos)
      COUNT(*) FILTER (
        WHERE us.status = 'cancelled' 
        AND us.updated_at >= now() - interval '30 days'
        AND sp.slug != 'free'
      ) as cancellations,
      
      -- Assinantes ativos atuais (apenas planos pagos)
      COUNT(*) FILTER (
        WHERE us.status = 'active' 
        AND sp.slug != 'free'
        AND (us.expires_at IS NULL OR us.expires_at > now())
      ) as active_subs,
      
      -- Base para cálculo de churn: assinantes que estavam ativos 30 dias atrás
      COUNT(*) FILTER (
        WHERE sp.slug != 'free'
        AND us.starts_at <= now() - interval '30 days'
        AND (
          us.status = 'active' 
          OR (us.status = 'cancelled' AND us.updated_at >= now() - interval '30 days')
        )
      ) as base_subs_30_days_ago
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
  )
  SELECT 
    -- Taxa de churn mensal
    CASE 
      WHEN cd.base_subs_30_days_ago > 0 THEN 
        ROUND((cd.cancellations::numeric / cd.base_subs_30_days_ago::numeric) * 100, 2)
      ELSE 0 
    END as monthly_churn_rate,
    
    cd.cancellations as total_cancellations_30_days,
    
    -- Taxa de retenção (inverso do churn)
    CASE 
      WHEN cd.base_subs_30_days_ago > 0 THEN 
        ROUND(((cd.base_subs_30_days_ago - cd.cancellations)::numeric / cd.base_subs_30_days_ago::numeric) * 100, 2)
      ELSE 100 
    END as retention_rate,
    
    cd.active_subs as active_subscribers
  FROM churn_data cd;
$function$;

-- Corrigir função get_ltv_metrics para cálculo mais preciso
CREATE OR REPLACE FUNCTION public.get_ltv_metrics()
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
$function$;

-- Corrigir função get_conversion_metrics para cálculo real
CREATE OR REPLACE FUNCTION public.get_conversion_metrics()
 RETURNS TABLE(free_to_paid_rate numeric, gestao_to_psi_regular_rate numeric, total_conversions_30_days bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH conversion_data AS (
    -- Usuários que fizeram upgrade de free para pago nos últimos 30 dias
    SELECT 
      COUNT(*) FILTER (
        WHERE old_plan.slug = 'free' 
        AND new_plan.slug IN ('gestao', 'psi_regular')
        AND us_new.created_at >= now() - interval '30 days'
      ) as free_to_paid_conversions,
      
      -- Usuários que fizeram upgrade de gestao para psi_regular nos últimos 30 dias
      COUNT(*) FILTER (
        WHERE old_plan.slug = 'gestao' 
        AND new_plan.slug = 'psi_regular'
        AND us_new.created_at >= now() - interval '30 days'
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
    WHERE us_new.created_at >= now() - interval '30 days'
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
    
    -- Total de conversões nos últimos 30 dias
    (cd.free_to_paid_conversions + cd.gestao_to_psi_conversions) as total_conversions_30_days
    
  FROM conversion_data cd;
$function$;

-- Nova função para evolução mensal do MRR
CREATE OR REPLACE FUNCTION public.get_monthly_revenue_evolution(months_back integer DEFAULT 12)
 RETURNS TABLE(month_year text, mrr numeric, mrr_growth_rate numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH monthly_mrr AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', us.starts_at), 'YYYY-MM') as month_year,
      DATE_TRUNC('month', us.starts_at) as month_date,
      SUM(sp.price_monthly) as monthly_revenue
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.starts_at >= DATE_TRUNC('month', now() - ($1 || ' months')::interval)
      AND sp.slug != 'free'
      AND us.status = 'active'
    GROUP BY DATE_TRUNC('month', us.starts_at)
    ORDER BY month_date
  ),
  revenue_with_growth AS (
    SELECT 
      month_year,
      monthly_revenue as mrr,
      LAG(monthly_revenue) OVER (ORDER BY month_year) as prev_mrr
    FROM monthly_mrr
  )
  SELECT 
    month_year,
    mrr,
    CASE 
      WHEN prev_mrr > 0 THEN 
        ROUND(((mrr - prev_mrr) / prev_mrr) * 100, 2)
      ELSE 0 
    END as mrr_growth_rate
  FROM revenue_with_growth
  ORDER BY month_year;
$function$;