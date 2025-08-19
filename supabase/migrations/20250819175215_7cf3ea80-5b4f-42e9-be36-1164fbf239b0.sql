-- Migration 3: Trigger Enhancement 

-- 1) Atualiza função validate_whatsapp_log_owner para preencher owner_id via payment_id (mantém mesmo nome)
CREATE OR REPLACE FUNCTION public.validate_whatsapp_log_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Preenche owner via payment quando houver payment_id
  IF NEW.payment_id IS NOT NULL THEN
    SELECT p.owner_id INTO NEW.owner_id
    FROM public.payments p
    WHERE p.id = NEW.payment_id;
  END IF;

  -- Rejeita apenas se owner_id ainda for null após tentativas
  IF NEW.owner_id IS NULL THEN
    RAISE EXCEPTION 'whatsapp_logs.owner_id não pôde ser resolvido (sem JWT e sem payment_id válido)';
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Garante que o trigger existe (CREATE IF NOT EXISTS não funciona para triggers)
DO $$
BEGIN
  -- Remove trigger se existir
  DROP TRIGGER IF EXISTS trg_validate_whatsapp_log_owner ON public.whatsapp_logs;
  
  -- Recria o trigger
  CREATE TRIGGER trg_validate_whatsapp_log_owner
    BEFORE INSERT ON public.whatsapp_logs
    FOR EACH ROW EXECUTE FUNCTION public.validate_whatsapp_log_owner();
END$$;