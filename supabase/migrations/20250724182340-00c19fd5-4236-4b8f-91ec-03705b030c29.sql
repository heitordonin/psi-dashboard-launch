-- Primeiro, vamos criar uma função que garante apenas uma assinatura ativa por usuário
CREATE OR REPLACE FUNCTION public.ensure_single_active_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Se estamos inserindo/atualizando para status ativo
  IF NEW.status = 'active' THEN
    -- Cancelar todas as outras assinaturas ativas do mesmo usuário
    UPDATE public.user_subscriptions 
    SET 
      status = 'cancelled',
      updated_at = now()
    WHERE 
      user_id = NEW.user_id 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status = 'active';
      
    -- Log da mudança para auditoria
    INSERT INTO public.admin_audit_log (
      user_id,
      admin_user_id,
      action,
      old_value,
      new_value,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.user_id, -- O próprio usuário está fazendo a mudança
      'subscription_change',
      jsonb_build_object('action', 'cancelled_previous_subscriptions'),
      jsonb_build_object(
        'new_subscription_id', NEW.id,
        'new_plan_id', NEW.plan_id,
        'new_status', NEW.status
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger que executa antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS ensure_single_active_subscription_trigger ON public.user_subscriptions;
CREATE TRIGGER ensure_single_active_subscription_trigger
  BEFORE INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_subscription();

-- Criar uma função para limpar assinaturas duplicadas existentes
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_subscriptions()
RETURNS void AS $$
BEGIN
  -- Para cada usuário com múltiplas assinaturas ativas, manter apenas a mais recente
  WITH duplicate_subs AS (
    SELECT 
      user_id,
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
    FROM public.user_subscriptions 
    WHERE status = 'active'
  )
  UPDATE public.user_subscriptions 
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id IN (
    SELECT id FROM duplicate_subs WHERE rn > 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a limpeza de duplicatas existentes
SELECT public.cleanup_duplicate_subscriptions();