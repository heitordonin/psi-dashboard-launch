
-- ========================================
-- MIGRAÇÃO DEFINITIVA: CORREÇÃO COMPLETA DE RLS
-- Remove todas as políticas inseguras e cria um conjunto limpo
-- ========================================

-- 1. LIMPAR COMPLETAMENTE A TABELA EXPENSES
-- Remove todas as políticas existentes para garantir estado limpo
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Only admins can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.expenses;

-- Criar políticas seguras para expenses (dados do usuário)
CREATE POLICY "Users can manage their own expenses"
ON public.expenses
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all expenses"
ON public.expenses
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 2. LIMPAR COMPLETAMENTE A TABELA EXPENSE_CATEGORIES
-- Remove todas as políticas existentes para garantir estado limpo
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can manage their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can create expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can view all expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Only admins can insert expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Only admins can update expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Only admins can delete expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Admins can manage expense categories" ON public.expense_categories;

-- Criar políticas seguras para expense_categories (dados globais)
CREATE POLICY "Authenticated users can view all expense categories"
ON public.expense_categories
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage expense categories"
ON public.expense_categories
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 3. VERIFICAÇÃO FINAL: Garantir que RLS está habilitado
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
