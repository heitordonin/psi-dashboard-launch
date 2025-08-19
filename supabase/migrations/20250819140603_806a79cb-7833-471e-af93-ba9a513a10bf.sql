-- Atualizar feature do plano Gestão de 100 para 40 mensagens
UPDATE public.subscription_plans 
SET features = features - 'whatsapp_limit_100' || jsonb_build_array('whatsapp_limit_40')
WHERE slug = 'gestao';