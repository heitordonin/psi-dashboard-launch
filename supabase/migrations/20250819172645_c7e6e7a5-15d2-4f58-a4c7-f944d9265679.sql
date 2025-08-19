-- Migration 1: RPC Overload Fix + Index (Corrigida)

-- 1) Remove a função com p_month primeiro para evitar erro de defaults
DROP FUNCTION IF EXISTS public.get_monthly_whatsapp_count(p_user_id uuid, p_month date);

-- 2) (Re)cria a versão "mês atual" usando FAIXA e fuso America/Sao_Paulo (index‑friendly)
CREATE OR REPLACE FUNCTION public.get_monthly_whatsapp_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  WITH b AS (
    SELECT
      -- Local midnight do início do mês em tz -> volta como timestamptz
      (date_trunc('month', timezone('America/Sao_Paulo', now()))
        AT TIME ZONE 'America/Sao_Paulo') AS start_ts,
      ((date_trunc('month', timezone('America/Sao_Paulo', now())) + interval '1 month')
        AT TIME ZONE 'America/Sao_Paulo') AS end_ts
  )
  SELECT COUNT(*)::integer
  FROM public.whatsapp_logs w, b
  WHERE w.owner_id = p_user_id
    AND w.status <> 'failed'
    AND w.created_at >= b.start_ts
    AND w.created_at <  b.end_ts;
$$;

-- 3) Versão por mês explícito (agora com nome novo e predicado por faixa)
CREATE OR REPLACE FUNCTION public.get_monthly_whatsapp_count_by_month(p_user_id uuid, p_month date)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  WITH b AS (
    SELECT
      (date_trunc('month', p_month::timestamp) AT TIME ZONE 'America/Sao_Paulo') AS start_ts,
      ((date_trunc('month', p_month::timestamp) + interval '1 month') AT TIME ZONE 'America/Sao_Paulo') AS end_ts
  )
  SELECT COUNT(*)::integer
  FROM public.whatsapp_logs w, b
  WHERE w.owner_id = p_user_id
    AND w.status <> 'failed'
    AND w.created_at >= b.start_ts
    AND w.created_at <  b.end_ts;
$$;

-- 4) Índice parcial coerente com o predicado por faixa
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_owner_created
  ON public.whatsapp_logs (owner_id, created_at)
  WHERE status <> 'failed';