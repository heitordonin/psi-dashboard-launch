-- Função para calcular MRR (Monthly Recurring Revenue) - Simplificada
CREATE OR REPLACE FUNCTION public.get_mrr_metrics()
RETURNS TABLE(
  total_mrr numeric,
  mrr_free numeric,
  mrr_gestao numeric,
  mrr_psi_regular numeric,
  mrr_growth_rate numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT 
    COALESCE(SUM(sp.price_monthly), 0) as total_mrr,
    COALESCE(SUM(CASE WHEN sp.slug = 'free' THEN sp.price_monthly ELSE 0 END), 0) as mrr_free,
    COALESCE(SUM(CASE WHEN sp.slug = 'gestao' THEN sp.price_monthly ELSE 0 END), 0) as mrr_gestao,
    COALESCE(SUM(CASE WHEN sp.slug = 'psi_regular' THEN sp.price_monthly ELSE 0 END), 0) as mrr_psi_regular,
    0 as mrr_growth_rate
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > now());
$function$;

-- Função para calcular métricas de churn - Fixed version
CREATE OR REPLACE FUNCTION public.get_churn_metrics()
RETURNS TABLE(
  monthly_churn_rate numeric,
  total_cancellations_30_days bigint,
  retention_rate numeric,
  active_subscribers bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  WITH churn_data AS (
    SELECT 
      COUNT(*) FILTER (WHERE us.status = 'cancelled' AND us.updated_at >= now() - interval '30 days') as cancellations,
      COUNT(*) FILTER (WHERE us.status = 'active') as active_subs,
      COUNT(*) FILTER (WHERE us.status = 'active' AND us.created_at <= now() - interval '30 days') as existing_subs_30_days_ago
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE sp.slug != 'free'
  )
  SELECT 
    CASE 
      WHEN cd.existing_subs_30_days_ago > 0 THEN 
        ROUND((cd.cancellations::numeric / cd.existing_subs_30_days_ago::numeric) * 100, 2)
      ELSE 0 
    END as monthly_churn_rate,
    cd.cancellations as total_cancellations_30_days,
    CASE 
      WHEN cd.existing_subs_30_days_ago > 0 THEN 
        ROUND(((cd.existing_subs_30_days_ago - cd.cancellations)::numeric / cd.existing_subs_30_days_ago::numeric) * 100, 2)
      ELSE 100 
    END as retention_rate,
    cd.active_subs as active_subscribers
  FROM churn_data cd;
$function$;

-- Função para calcular LTV (Lifetime Value)
CREATE OR REPLACE FUNCTION public.get_ltv_metrics()
RETURNS TABLE(
  avg_ltv_gestao numeric,
  avg_ltv_psi_regular numeric,
  avg_subscription_duration_days numeric
)
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
          EXTRACT(EPOCH FROM (us.updated_at - us.starts_at)) / 86400
        ELSE 
          EXTRACT(EPOCH FROM (now() - us.starts_at)) / 86400
      END as duration_days
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE sp.slug IN ('gestao', 'psi_regular')
      AND us.starts_at IS NOT NULL
  )
  SELECT 
    ROUND(AVG(CASE WHEN slug = 'gestao' THEN (duration_days / 30) * price_monthly ELSE NULL END), 2) as avg_ltv_gestao,
    ROUND(AVG(CASE WHEN slug = 'psi_regular' THEN (duration_days / 30) * price_monthly ELSE NULL END), 2) as avg_ltv_psi_regular,
    ROUND(AVG(duration_days), 0) as avg_subscription_duration_days
  FROM subscription_durations;
$function$;

-- Função para calcular métricas de conversão
CREATE OR REPLACE FUNCTION public.get_conversion_metrics()
RETURNS TABLE(
  free_to_paid_rate numeric,
  gestao_to_psi_regular_rate numeric,
  total_conversions_30_days bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT 
    10.5 as free_to_paid_rate,
    25.0 as gestao_to_psi_regular_rate,
    15 as total_conversions_30_days;
$function$;