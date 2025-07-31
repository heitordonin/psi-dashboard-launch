-- Remove a restrição de email único por usuário na tabela patients
-- Permite que um usuário tenha múltiplos pacientes com o mesmo email
DROP INDEX IF EXISTS public.patients_email_owner_unique;