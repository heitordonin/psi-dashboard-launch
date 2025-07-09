-- Atualizar função get_darf_completion_stats para excluir documentos deletados
CREATE OR REPLACE FUNCTION public.get_darf_completion_stats(due_month date)
RETURNS TABLE(
  total_psi_regular_users bigint,
  users_with_darf_sent bigint,
  users_manually_completed bigint,
  users_pending bigint,
  completion_percentage numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH psi_regular_users AS (
    SELECT DISTINCT us.user_id
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE sp.slug = 'psi_regular' 
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  ),
  darf_sent AS (
    SELECT DISTINCT ad.user_id
    FROM public.admin_documents ad
    WHERE ad.title ILIKE '%DARF%'
      AND DATE_TRUNC('month', ad.due_date) = DATE_TRUNC('month', $1)
      AND ad.hidden_from_user = false  -- Excluir documentos deletados/ocultos
  ),
  manual_completed AS (
    SELECT DISTINCT dmc.user_id
    FROM public.darf_manual_completions dmc
    WHERE DATE_TRUNC('month', dmc.competency) = DATE_TRUNC('month', $1)
  )
  SELECT 
    (SELECT COUNT(*) FROM psi_regular_users) as total_psi_regular_users,
    (SELECT COUNT(*) FROM darf_sent ds JOIN psi_regular_users pru ON ds.user_id = pru.user_id) as users_with_darf_sent,
    (SELECT COUNT(*) FROM manual_completed mc JOIN psi_regular_users pru ON mc.user_id = pru.user_id) as users_manually_completed,
    (
      SELECT COUNT(*) 
      FROM psi_regular_users pru
      WHERE pru.user_id NOT IN (SELECT user_id FROM darf_sent)
        AND pru.user_id NOT IN (SELECT user_id FROM manual_completed)
    ) as users_pending,
    (
      CASE 
        WHEN (SELECT COUNT(*) FROM psi_regular_users) = 0 THEN 0
        ELSE ROUND(
          (
            (SELECT COUNT(*) FROM darf_sent ds JOIN psi_regular_users pru ON ds.user_id = pru.user_id) +
            (SELECT COUNT(*) FROM manual_completed mc JOIN psi_regular_users pru ON mc.user_id = pru.user_id)
          )::numeric / (SELECT COUNT(*) FROM psi_regular_users)::numeric * 100, 2
        )
      END
    ) as completion_percentage;
$function$;