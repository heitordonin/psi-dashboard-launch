
-- First, let's see what plans currently exist
SELECT id, name, slug, price_monthly, price_yearly FROM public.subscription_plans ORDER BY price_monthly;

-- Update the intermediate plan to become the "Gestão" plan
-- Note: Based on the code, it looks like we might have 'basic' as the intermediate plan
UPDATE public.subscription_plans
SET
  name = 'Gestão',
  slug = 'gestao',
  price_monthly = 8900,  -- R$89,00 in cents
  price_yearly = 7120    -- R$71,20 in cents (annual discount)
WHERE
  slug = 'basic';

-- Update the prices for the "Psi Regular" plan
UPDATE public.subscription_plans
SET
  price_monthly = 38900, -- R$389,00 in cents
  price_yearly = 29175   -- R$291,75 in cents (annual discount)
WHERE
  slug = 'psi_regular';

-- Verify the changes
SELECT id, name, slug, price_monthly, price_yearly FROM public.subscription_plans ORDER BY price_monthly;
