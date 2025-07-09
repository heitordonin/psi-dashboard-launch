-- Remove redundant Gestão features from Psi Regular plan
-- Keep only the specific Psi Regular features plus whatsapp_support for "Tudo do plano Gestão +"
UPDATE public.subscription_plans
SET features = '["whatsapp_support", "receita_saude_receipts", "monthly_darf", "carne_leao_tracking"]'::jsonb
WHERE slug = 'psi_regular';