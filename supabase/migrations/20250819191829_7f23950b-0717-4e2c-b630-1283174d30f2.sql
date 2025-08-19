-- Create function to get top WhatsApp users by message count
CREATE OR REPLACE FUNCTION public.get_top_whatsapp_users(
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  user_id uuid,
  user_name text,
  total_messages bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT 
    wl.owner_id as user_id,
    COALESCE(p.full_name, p.display_name, 'Usuário sem nome') as user_name,
    COUNT(*) as total_messages
  FROM public.whatsapp_logs wl
  LEFT JOIN public.profiles p ON wl.owner_id = p.id
  WHERE wl.status != 'failed'
    AND ($1 IS NULL OR wl.created_at::date >= $1)
    AND ($2 IS NULL OR wl.created_at::date <= $2)
  GROUP BY wl.owner_id, p.full_name, p.display_name
  ORDER BY total_messages DESC
  LIMIT $3;
$function$