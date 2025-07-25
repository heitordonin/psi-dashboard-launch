-- Remove the problematic unique constraint that prevents multiple subscriptions per user
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key;

-- Add a unique constraint for active subscriptions only (prevents multiple active plans)
CREATE UNIQUE INDEX user_subscriptions_active_unique 
ON user_subscriptions (user_id) 
WHERE status = 'active';

-- Improve the ensure_single_active_subscription function to handle the new logic
CREATE OR REPLACE FUNCTION public.ensure_single_active_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
      NEW.user_id,
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
$function$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS ensure_single_active_subscription_trigger ON user_subscriptions;
CREATE TRIGGER ensure_single_active_subscription_trigger
  BEFORE INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_subscription();