-- Corrigir preços dos planos dividindo por 100
UPDATE public.subscription_plans 
SET 
  price_monthly = price_monthly / 100,
  price_yearly = price_yearly / 100,
  updated_at = now()
WHERE slug IN ('gestao', 'psi_regular');