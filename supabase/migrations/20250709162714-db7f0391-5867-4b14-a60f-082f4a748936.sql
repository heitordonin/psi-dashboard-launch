-- Criar tabela para controle manual de DARFs
CREATE TABLE public.darf_manual_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  competency DATE NOT NULL,
  marked_completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  admin_notes TEXT NOT NULL,
  created_by_admin_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, competency)
);

-- Habilitar RLS
ALTER TABLE public.darf_manual_completions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins
CREATE POLICY "Admins can manage all darf manual completions" 
ON public.darf_manual_completions 
FOR ALL 
USING (is_admin(auth.uid())) 
WITH CHECK (is_admin(auth.uid()));

-- Função para crescimento de usuários por plano
CREATE OR REPLACE FUNCTION public.get_daily_user_growth_by_plan(start_date date, end_date date)
RETURNS TABLE(date date, free_count bigint, gestao_count bigint, psi_regular_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    d.date::date,
    COALESCE(u.free_count, 0) as free_count,
    COALESCE(u.gestao_count, 0) as gestao_count,
    COALESCE(u.psi_regular_count, 0) as psi_regular_count
  FROM (
    SELECT generate_series($1::timestamp, $2::timestamp, '1 day'::interval)::date as date
  ) d
  LEFT JOIN (
    SELECT 
      au.created_at::date as date,
      COUNT(*) FILTER (WHERE sp.slug = 'free') as free_count,
      COUNT(*) FILTER (WHERE sp.slug = 'gestao') as gestao_count,
      COUNT(*) FILTER (WHERE sp.slug = 'psi_regular') as psi_regular_count
    FROM auth.users au
    LEFT JOIN public.user_subscriptions us ON au.id = us.user_id 
      AND us.status = 'active' 
      AND (us.expires_at IS NULL OR us.expires_at > au.created_at)
    LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE au.created_at::date BETWEEN $1 AND $2
    GROUP BY au.created_at::date
  ) u ON d.date = u.date
  ORDER BY d.date;
$function$;

-- Função para estatísticas de completude de DARF
CREATE OR REPLACE FUNCTION public.get_darf_completion_stats(competency_month date)
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
      AND DATE_TRUNC('month', ad.competency) = DATE_TRUNC('month', $1)
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

-- Trigger para updated_at
CREATE TRIGGER update_darf_manual_completions_updated_at
BEFORE UPDATE ON public.darf_manual_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();