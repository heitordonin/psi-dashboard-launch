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