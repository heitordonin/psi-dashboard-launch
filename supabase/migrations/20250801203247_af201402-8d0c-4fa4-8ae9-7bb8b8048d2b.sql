-- Corrigir função get_mrr_metrics para excluir planos gratuitos
CREATE OR REPLACE FUNCTION public.get_mrr_metrics()
 RETURNS TABLE(total_mrr numeric, mrr_free numeric, mrr_gestao numeric, mrr_psi_regular numeric, mrr_growth_rate numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH current_month_mrr AS (
    SELECT 
      COALESCE(SUM(CASE WHEN sp.slug != 'free' THEN sp.price_monthly ELSE 0 END), 0) as total_mrr,
      COALESCE(SUM(CASE WHEN sp.slug = 'free' THEN sp.price_monthly ELSE 0 END), 0) as mrr_free,
      COALESCE(SUM(CASE WHEN sp.slug = 'gestao' THEN sp.price_monthly ELSE 0 END), 0) as mrr_gestao,
      COALESCE(SUM(CASE WHEN sp.slug = 'psi_regular' THEN sp.price_monthly ELSE 0 END), 0) as mrr_psi_regular
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  ),
  previous_month_mrr AS (
    SELECT 
      COALESCE(SUM(CASE WHEN sp.slug != 'free' THEN sp.price_monthly ELSE 0 END), 0) as prev_total_mrr
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.status = 'active'
      AND us.starts_at <= (now() - interval '1 month')
      AND (us.expires_at IS NULL OR us.expires_at > (now() - interval '1 month'))
      AND sp.slug != 'free'
  )
  SELECT 
    c.total_mrr,
    c.mrr_free,
    c.mrr_gestao,
    c.mrr_psi_regular,
    CASE 
      WHEN p.prev_total_mrr > 0 THEN 
        ROUND(((c.total_mrr - p.prev_total_mrr) / p.prev_total_mrr) * 100, 2)
      ELSE 0 
    END as mrr_growth_rate
  FROM current_month_mrr c
  CROSS JOIN previous_month_mrr p;
$function$;

-- Corrigir função get_churn_metrics para excluir cancelamentos de planos gratuitos
CREATE OR REPLACE FUNCTION public.get_churn_metrics(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
 RETURNS TABLE(monthly_churn_rate numeric, total_cancellations_30_days bigint, retention_rate numeric, active_subscribers bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH churn_data AS (
    SELECT 
      -- Cancelamentos no período especificado (APENAS planos pagos)
      COUNT(*) FILTER (
        WHERE us.status = 'cancelled' 
        AND ($1 IS NULL OR us.updated_at::date >= $1)
        AND ($2 IS NULL OR us.updated_at::date <= $2)
        AND sp.slug != 'free'
        -- Verificar se a assinatura anterior era de um plano pago
        AND NOT EXISTS (
          SELECT 1 FROM public.user_subscriptions us_new
          JOIN public.subscription_plans sp_new ON us_new.plan_id = sp_new.id
          WHERE us_new.user_id = us.user_id 
            AND us_new.created_at > us.updated_at
            AND sp_new.slug != 'free'
            AND us_new.status = 'active'
        )
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
$function$;