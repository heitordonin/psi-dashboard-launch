
-- ========================================
-- MIGRAÇÃO CRÍTICA DE SEGURANÇA RLS - FASE 1
-- Remove políticas inseguras e mantém apenas isolamento por usuário
-- ========================================

-- 1. LIMPAR COMPLETAMENTE A TABELA PAYMENTS
-- Remove todas as políticas existentes inseguras
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.payments;
DROP POLICY IF EXISTS "Users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;

-- Manter apenas políticas seguras para payments
-- (As políticas "Users can manage their own payments" e "Admins can manage all payments" já existem e são seguras)

-- 2. LIMPAR COMPLETAMENTE A TABELA PATIENTS
-- Remove todas as políticas existentes inseguras
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.patients;
DROP POLICY IF EXISTS "Users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;

-- Manter apenas políticas seguras para patients
-- (As políticas "Users can manage their own patients" e "Admins can manage all patients" já existem e são seguras)

-- 3. LIMPAR COMPLETAMENTE A TABELA EXPENSES
-- Remove todas as políticas existentes inseguras
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.expenses;
DROP POLICY IF EXISTS "Users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Only admins can delete expenses" ON public.expenses;

-- Manter apenas políticas seguras para expenses
-- (As políticas "Users can manage their own expenses" e "Admins can manage all expenses" já existem e são seguras)

-- 4. LIMPAR COMPLETAMENTE A TABELA INVOICE_DESCRIPTIONS
-- Remove todas as políticas existentes inseguras
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.invoice_descriptions;
DROP POLICY IF EXISTS "Users can view invoice_descriptions" ON public.invoice_descriptions;
DROP POLICY IF EXISTS "Users can create invoice_descriptions" ON public.invoice_descriptions;
DROP POLICY IF EXISTS "Users can update invoice_descriptions" ON public.invoice_descriptions;
DROP POLICY IF EXISTS "Users can delete invoice_descriptions" ON public.invoice_descriptions;

-- Manter apenas políticas seguras para invoice_descriptions
-- (As políticas "Users can manage their own invoice_descriptions" e "Admins can manage all invoice_descriptions" já existem e são seguras)

-- 5. VERIFICAÇÃO FINAL: Garantir que RLS está habilitado
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_descriptions ENABLE ROW LEVEL SECURITY;

-- 6. CONFIRMAÇÃO: As políticas seguras restantes são:
-- payments: "Users can manage their own payments", "Admins can manage all payments"
-- patients: "Users can manage their own patients", "Admins can manage all patients"  
-- expenses: "Users can manage their own expenses", "Admins can manage all expenses"
-- invoice_descriptions: "Users can manage their own invoice_descriptions", "Admins can manage all invoice_descriptions"

-- RESULTADO: Dados sensíveis agora protegidos por isolamento de usuário
-- Sem interrupção de serviço, apenas remoção de vulnerabilidades críticas
