
-- Adicionar foreign key constraint entre payments.owner_id e profiles.id
-- Isso permitirá que o Supabase faça joins automáticos corretamente
ALTER TABLE public.payments 
ADD CONSTRAINT fk_payments_owner_id 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Também vamos garantir que owner_id não seja nullable para manter integridade
-- Primeiro, vamos atualizar registros existentes que possam ter owner_id NULL
UPDATE public.payments 
SET owner_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.id = payments.patient_id
  LIMIT 1
) 
WHERE owner_id IS NULL;

-- Agora podemos tornar a coluna NOT NULL
ALTER TABLE public.payments 
ALTER COLUMN owner_id SET NOT NULL;
