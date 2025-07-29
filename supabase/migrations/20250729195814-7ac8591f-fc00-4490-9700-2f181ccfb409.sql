-- Atualizar preços do plano gestão
UPDATE public.subscription_plans 
SET 
  price_monthly = 4900,  -- R$ 49,00 (em centavos)
  price_yearly = 3920,   -- R$ 39,20 (em centavos) 
  updated_at = now()
WHERE slug = 'gestao';