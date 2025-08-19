-- Atualizar função RPC para usar apenas user_id e mês atual automaticamente
CREATE OR REPLACE FUNCTION public.get_monthly_whatsapp_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COUNT(*)::integer
  FROM public.whatsapp_logs
  WHERE owner_id = p_user_id
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    AND status != 'failed';
$function$