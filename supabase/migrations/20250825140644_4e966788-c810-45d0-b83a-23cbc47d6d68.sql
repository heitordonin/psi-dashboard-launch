-- Atualizar preço do plano Psi Regular para R$ 269,00
UPDATE subscription_plans 
SET 
  price_monthly = 269.00,
  price_yearly = 2690.00,
  updated_at = NOW()
WHERE slug = 'psi_regular';