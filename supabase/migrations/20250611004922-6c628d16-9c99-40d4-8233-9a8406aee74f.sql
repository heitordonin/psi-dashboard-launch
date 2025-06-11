
-- Remover constraints UNIQUE globais existentes
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_cpf_key;
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_email_key;
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_cnpj_key;

-- Criar constraints UNIQUE compostas que consideram o owner_id
-- Para CPF: único por usuário, mas permitindo nulos
CREATE UNIQUE INDEX patients_cpf_owner_unique 
ON public.patients (cpf, owner_id) 
WHERE cpf IS NOT NULL AND cpf != '';

-- Para CNPJ: único por usuário, mas permitindo nulos
CREATE UNIQUE INDEX patients_cnpj_owner_unique 
ON public.patients (cnpj, owner_id) 
WHERE cnpj IS NOT NULL AND cnpj != '';

-- Para email: único por usuário, mas permitindo nulos
CREATE UNIQUE INDEX patients_email_owner_unique 
ON public.patients (email, owner_id) 
WHERE email IS NOT NULL AND email != '';
