-- Atualizar preços e funcionalidades dos planos conforme solicitado

-- Atualizar plano Grátis
UPDATE public.subscription_plans
SET
  price_monthly = 0,
  price_yearly = 0,
  max_patients = 3,
  features = '["unlimited_invoices", "basic_dashboard", "email_support"]'::jsonb
WHERE slug = 'gratis';

-- Atualizar plano Gestão
UPDATE public.subscription_plans
SET
  price_monthly = 6900,  -- R$69,00 em centavos
  price_yearly = 5520,   -- R$55,20 em centavos
  max_patients = NULL,   -- Pacientes ilimitados
  features = '["unlimited_invoices", "basic_dashboard", "email_support", "whatsapp_reminders"]'::jsonb
WHERE slug = 'gestao';

-- Atualizar plano Psi Regular
UPDATE public.subscription_plans
SET
  price_monthly = 18900, -- R$189,00 em centavos
  price_yearly = 15120,  -- R$151,20 em centavos
  max_patients = NULL,   -- Pacientes ilimitados
  features = '["unlimited_invoices", "basic_dashboard", "email_support", "whatsapp_reminders", "whatsapp_support", "receita_saude_receipts", "monthly_darf", "carne_leao_tracking"]'::jsonb
WHERE slug = 'psi_regular';

-- Verificar as alterações
SELECT name, slug, price_monthly, price_yearly, max_patients, features 
FROM public.subscription_plans 
ORDER BY price_monthly;