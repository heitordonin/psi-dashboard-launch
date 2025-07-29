-- Função para calcular MRR (Monthly Recurring Revenue) - Fixed version
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
  WITH current_month_mrr AS (
    SELECT 
      sp.slug,
      sp.price_monthly,
      COUNT(*) as active_subs
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
    GROUP BY sp.slug, sp.price_monthly
  ),
  current_total AS (
    SELECT COALESCE(SUM(cmr.price_monthly * cmr.active_subs), 0) as current_mrr
    FROM current_month_mrr cmr
  ),
  previous_month_mrr AS (
    SELECT 
      COALESCE(SUM(sp.price_monthly * 
        (SELECT COUNT(*) FROM public.user_subscriptions us2 
         WHERE us2.plan_id = sp.id 
         AND us2.status = 'active'
         AND us2.created_at <= (now() - interval '1 month')
         AND (us2.expires_at IS NULL OR us2.expires_at > (now() - interval '1 month'))
        )
      ), 0) as prev_total
    FROM public.subscription_plans sp
    WHERE sp.is_active = true
  )
  SELECT 
    ct.current_mrr as total_mrr,
    COALESCE(SUM(CASE WHEN cmr.slug = 'free' THEN cmr.price_monthly * cmr.active_subs ELSE 0 END), 0) as mrr_free,
    COALESCE(SUM(CASE WHEN cmr.slug = 'gestao' THEN cmr.price_monthly * cmr.active_subs ELSE 0 END), 0) as mrr_gestao,
    COALESCE(SUM(CASE WHEN cmr.slug = 'psi_regular' THEN cmr.price_monthly * cmr.active_subs ELSE 0 END), 0) as mrr_psi_regular,
    CASE 
      WHEN pmr.prev_total > 0 THEN 
        ROUND((ct.current_mrr - pmr.prev_total) / pmr.prev_total * 100, 2)
      ELSE 0 
    END as mrr_growth_rate
  FROM current_month_mrr cmr
  CROSS JOIN current_total ct
  CROSS JOIN previous_month_mrr pmr
  GROUP BY ct.current_mrr, pmr.prev_total;
$function$;

-- Função para calcular métricas de churn
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
      COUNT(*) FILTER (WHERE status = 'cancelled' AND updated_at >= now() - interval '30 days') as cancellations,
      COUNT(*) FILTER (WHERE status = 'active') as active_subs,
      COUNT(*) FILTER (WHERE status = 'active' AND created_at <= now() - interval '30 days') as existing_subs_30_days_ago
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
  WITH conversion_data AS (
    SELECT 
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM public.user_subscriptions us2 
          JOIN public.subscription_plans sp2 ON us2.plan_id = sp2.id
          WHERE us2.user_id = us.user_id 
          AND sp2.slug != 'free' 
          AND us2.created_at > us.created_at
        )
      ) as free_to_paid_conversions,
      
      COUNT(*) FILTER (
        WHERE sp.slug = 'free'
      ) as total_free_users,
      
      COUNT(*) FILTER (
        WHERE sp.slug = 'gestao' AND EXISTS (
          SELECT 1 FROM public.user_subscriptions us2 
          JOIN public.subscription_plans sp2 ON us2.plan_id = sp2.id
          WHERE us2.user_id = us.user_id 
          AND sp2.slug = 'psi_regular' 
          AND us2.created_at > us.created_at
        )
      ) as gestao_to_psi_conversions,
      
      COUNT(*) FILTER (WHERE sp.slug = 'gestao') as total_gestao_users,
      
      COUNT(*) FILTER (
        WHERE sp.slug != 'free' 
        AND us.created_at >= now() - interval '30 days'
        AND EXISTS (
          SELECT 1 FROM public.user_subscriptions us_prev
          JOIN public.subscription_plans sp_prev ON us_prev.plan_id = sp_prev.id
          WHERE us_prev.user_id = us.user_id 
          AND sp_prev.slug = 'free'
          AND us_prev.created_at < us.created_at
        )
      ) as recent_conversions
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
  )
  SELECT 
    CASE 
      WHEN cd.total_free_users > 0 THEN 
        ROUND((cd.free_to_paid_conversions::numeric / cd.total_free_users::numeric) * 100, 2)
      ELSE 0 
    END as free_to_paid_rate,
    CASE 
      WHEN cd.total_gestao_users > 0 THEN 
        ROUND((cd.gestao_to_psi_conversions::numeric / cd.total_gestao_users::numeric) * 100, 2)
      ELSE 0 
    END as gestao_to_psi_regular_rate,
    cd.recent_conversions as total_conversions_30_days
  FROM conversion_data cd;
$function$;

-- Função para evolução da receita mensal
CREATE OR REPLACE FUNCTION public.get_monthly_revenue_evolution(start_date date, end_date date)
RETURNS TABLE(
  month date,
  mrr numeric,
  new_mrr numeric,
  churned_mrr numeric,
  net_mrr_change numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  WITH monthly_data AS (
    SELECT 
      DATE_TRUNC('month', generate_series($1::timestamp, $2::timestamp, '1 month'::interval))::date as month
  ),
  subscription_changes AS (
    SELECT 
      DATE_TRUNC('month', us.created_at)::date as month,
      sp.price_monthly,
      'new' as change_type
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.created_at::date BETWEEN $1 AND $2
      AND sp.slug != 'free'
    
    UNION ALL
    
    SELECT 
      DATE_TRUNC('month', us.updated_at)::date as month,
      -sp.price_monthly as price_monthly,
      'churned' as change_type
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.updated_at::date BETWEEN $1 AND $2
      AND us.status = 'cancelled'
      AND sp.slug != 'free'
  )
  SELECT 
    md.month,
    COALESCE(SUM(CASE WHEN sc.change_type = 'new' THEN sc.price_monthly ELSE 0 END) - 
             SUM(CASE WHEN sc.change_type = 'churned' THEN ABS(sc.price_monthly) ELSE 0 END), 0) as mrr,
    COALESCE(SUM(CASE WHEN sc.change_type = 'new' THEN sc.price_monthly ELSE 0 END), 0) as new_mrr,
    COALESCE(SUM(CASE WHEN sc.change_type = 'churned' THEN ABS(sc.price_monthly) ELSE 0 END), 0) as churned_mrr,
    COALESCE(SUM(sc.price_monthly), 0) as net_mrr_change
  FROM monthly_data md
  LEFT JOIN subscription_changes sc ON md.month = sc.month
  GROUP BY md.month
  ORDER BY md.month;
$function$;