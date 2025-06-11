
-- Verificar se a coluna has_payment_link já existe na tabela payments
-- Se não existir, adicionar a coluna
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'has_payment_link'
    ) THEN
        ALTER TABLE public.payments 
        ADD COLUMN has_payment_link BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;
