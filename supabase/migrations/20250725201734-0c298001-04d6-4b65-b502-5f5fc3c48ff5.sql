-- 1. Corrigir funções atômicas para UPDATE em vez de INSERT quando possível
CREATE OR REPLACE FUNCTION public.atomic_upsert_subscription(
  p_user_id uuid,
  p_plan_slug text,
  p_stripe_customer_id text DEFAULT NULL,
  p_subscription_tier text DEFAULT NULL,
  p_subscription_end timestamp with time zone DEFAULT NULL,
  p_subscribed boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan_id UUID;
  v_existing_subscription_id UUID;
  v_operation_type TEXT := 'insert';
  v_result jsonb;
BEGIN
  -- Lock user para evitar race conditions
  PERFORM 1 FROM auth.users WHERE id = p_user_id FOR UPDATE;
  
  -- Buscar plan_id pelo slug
  SELECT id INTO v_plan_id 
  FROM public.subscription_plans 
  WHERE slug = p_plan_slug AND is_active = true;
  
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan not found for slug: %', p_plan_slug;
  END IF;
  
  -- Verificar se já existe assinatura ativa para o mesmo plano
  SELECT id INTO v_existing_subscription_id
  FROM public.user_subscriptions 
  WHERE user_id = p_user_id 
    AND plan_id = v_plan_id 
    AND status = 'active'
  LIMIT 1;
  
  IF v_existing_subscription_id IS NOT NULL THEN
    -- UPDATE da assinatura existente
    UPDATE public.user_subscriptions 
    SET 
      expires_at = p_subscription_end,
      updated_at = now()
    WHERE id = v_existing_subscription_id;
    
    v_operation_type := 'update';
    v_result := jsonb_build_object(
      'success', true,
      'operation', 'update',
      'subscription_id', v_existing_subscription_id,
      'plan_id', v_plan_id,
      'subscription_tier', p_subscription_tier,
      'subscribed', p_subscribed,
      'plan_slug', p_plan_slug
    );
  ELSE
    -- Cancelar todas as outras assinaturas ativas
    UPDATE public.user_subscriptions 
    SET 
      status = 'cancelled',
      updated_at = now()
    WHERE 
      user_id = p_user_id 
      AND status = 'active';
    
    -- INSERT nova assinatura
    INSERT INTO public.user_subscriptions (
      user_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      updated_at
    ) VALUES (
      p_user_id,
      v_plan_id,
      'active',
      now(),
      p_subscription_end,
      now()
    ) RETURNING id INTO v_existing_subscription_id;
    
    v_result := jsonb_build_object(
      'success', true,
      'operation', 'insert',
      'subscription_id', v_existing_subscription_id,
      'plan_id', v_plan_id,
      'subscription_tier', p_subscription_tier,
      'subscribed', p_subscribed,
      'plan_slug', p_plan_slug
    );
  END IF;
  
  -- Log da operação
  INSERT INTO public.admin_audit_log (
    user_id,
    admin_user_id,
    action,
    old_value,
    new_value
  ) VALUES (
    p_user_id,
    p_user_id,
    'atomic_subscription_upsert',
    jsonb_build_object('operation_type', v_operation_type),
    v_result
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Atomic subscription upsert failed: %', SQLERRM;
END;
$$;

-- 2. Função de cleanup automático das assinaturas antigas
CREATE OR REPLACE FUNCTION public.cleanup_old_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Remove assinaturas canceladas com mais de 90 dias
  DELETE FROM public.user_subscriptions 
  WHERE status = 'cancelled' 
    AND updated_at < now() - interval '90 days';
    
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Log do cleanup
  IF cleanup_count > 0 THEN
    INSERT INTO public.admin_audit_log (
      user_id,
      admin_user_id,
      action,
      old_value,
      new_value
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'cleanup_old_subscriptions',
      jsonb_build_object('deleted_count', cleanup_count),
      jsonb_build_object('cleanup_date', now())
    );
  END IF;
END;
$$;

-- 3. Atualizar função de force sync para usar upsert
CREATE OR REPLACE FUNCTION public.atomic_force_sync_subscription(
  p_user_id uuid,
  p_plan_slug text,
  p_stripe_customer_id text DEFAULT NULL,
  p_subscription_tier text DEFAULT NULL,
  p_subscription_end timestamp with time zone DEFAULT NULL,
  p_subscribed boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Usar a nova função de upsert
  RETURN atomic_upsert_subscription(
    p_user_id,
    p_plan_slug,
    p_stripe_customer_id,
    p_subscription_tier,
    p_subscription_end,
    p_subscribed
  );
END;
$$;

-- 4. Primeiro limpar duplicatas existentes se houver
WITH duplicates AS (
  SELECT 
    user_id,
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM public.user_subscriptions 
  WHERE status = 'active'
)
UPDATE public.user_subscriptions 
SET status = 'cancelled', updated_at = now()
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 5. Adicionar índice único para prevenir múltiplas assinaturas ativas
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_active_unique 
ON public.user_subscriptions (user_id) 
WHERE status = 'active';