
-- 1) Adicionar coluna updated_at em payments (necessária para os triggers existentes)
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2) Adicionar coluna updated_at em expenses (há trigger similar; previne erros futuros)
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
