-- Remover constraints únicas antigas que não consideram soft delete
DROP INDEX IF EXISTS patients_cpf_owner_unique;
DROP INDEX IF EXISTS patients_cnpj_owner_unique;

-- Recriar constraints únicas que excluem pacientes soft-deleted
CREATE UNIQUE INDEX patients_cpf_owner_unique 
ON public.patients (cpf, owner_id) 
WHERE cpf IS NOT NULL AND cpf != '' AND deleted_at IS NULL;

CREATE UNIQUE INDEX patients_cnpj_owner_unique 
ON public.patients (cnpj, owner_id) 
WHERE cnpj IS NOT NULL AND cnpj != '' AND deleted_at IS NULL;