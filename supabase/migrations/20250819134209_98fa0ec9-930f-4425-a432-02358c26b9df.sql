-- Criar função para contar mensagens WhatsApp do mês atual por usuário
CREATE OR REPLACE FUNCTION public.get_monthly_whatsapp_count(p_user_id uuid, p_month date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COUNT(*)::integer
  FROM public.whatsapp_logs
  WHERE owner_id = p_user_id
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_month)
    AND status != 'failed';
$$;

-- Atualizar features dos planos existentes para incluir limite de WhatsApp
UPDATE public.subscription_plans 
SET features = features || jsonb_build_array('whatsapp_limit_100')
WHERE slug = 'gestao';

UPDATE public.subscription_plans 
SET features = features || jsonb_build_array('unlimited_whatsapp')  
WHERE slug = 'psi_regular';

-- Garantir que o plano free não tenha acesso ao WhatsApp
UPDATE public.subscription_plans 
SET features = features - 'whatsapp_limit_100' - 'unlimited_whatsapp'
WHERE slug = 'free';