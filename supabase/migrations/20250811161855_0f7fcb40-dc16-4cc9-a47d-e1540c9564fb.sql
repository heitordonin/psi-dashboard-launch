-- Atualizar o preço do plano Psi Regular de R$ 189,00 para R$ 249,00
UPDATE public.subscription_plans 
SET 
  price_monthly = 249.00,
  price_yearly = 2490.00, -- Assumindo desconto anual (10 meses)
  updated_at = now()
WHERE slug = 'psi_regular';

-- Verificar se a atualização foi feita corretamente
SELECT slug, name, price_monthly, price_yearly 
FROM public.subscription_plans 
WHERE slug = 'psi_regular';