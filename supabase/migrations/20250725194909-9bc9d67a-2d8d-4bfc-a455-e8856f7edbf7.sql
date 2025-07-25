-- Criar função atômica para cancelar e inserir nova assinatura
CREATE OR REPLACE FUNCTION public.atomic_cancel_and_insert_subscription(
  p_user_id UUID,
  p_new_plan_id UUID,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_subscription_tier TEXT DEFAULT NULL,
  p_subscription_end TIMESTAMPTZ DEFAULT NULL,
  p_subscribed BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cancelled_count INTEGER := 0;
  v_new_subscription_id UUID;
  v_result jsonb;
BEGIN
  -- Lock user para evitar race conditions
  PERFORM 1 FROM auth.users WHERE id = p_user_id FOR UPDATE;
  
  -- Cancelar todas as assinaturas ativas do usuário
  UPDATE public.user_subscriptions 
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE 
    user_id = p_user_id 
    AND status = 'active';
    
  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
  
  -- Inserir nova assinatura
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    status,
    starts_at,
    expires_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_new_plan_id,
    'active',
    now(),
    p_subscription_end,
    now()
  ) RETURNING id INTO v_new_subscription_id;
  
  -- Log da operação para auditoria
  INSERT INTO public.admin_audit_log (
    user_id,
    admin_user_id,
    action,
    old_value,
    new_value
  ) VALUES (
    p_user_id,
    p_user_id,
    'atomic_subscription_update',
    jsonb_build_object(
      'cancelled_subscriptions', v_cancelled_count,
      'stripe_customer_id', p_stripe_customer_id
    ),
    jsonb_build_object(
      'new_subscription_id', v_new_subscription_id,
      'plan_id', p_new_plan_id,
      'subscription_tier', p_subscription_tier,
      'subscribed', p_subscribed,
      'subscription_end', p_subscription_end
    )
  );
  
  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'cancelled_count', v_cancelled_count,
    'new_subscription_id', v_new_subscription_id,
    'plan_id', p_new_plan_id,
    'subscription_tier', p_subscription_tier,
    'subscribed', p_subscribed
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, o PostgreSQL fará rollback automático
    RAISE EXCEPTION 'Atomic subscription update failed: %', SQLERRM;
END;
$$;

-- Criar função atômica para force sync
CREATE OR REPLACE FUNCTION public.atomic_force_sync_subscription(
  p_user_id UUID,
  p_plan_slug TEXT,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_subscription_tier TEXT DEFAULT NULL,
  p_subscription_end TIMESTAMPTZ DEFAULT NULL,
  p_subscribed BOOLEAN DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan_id UUID;
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
  
  -- Usar a função atômica existente
  SELECT atomic_cancel_and_insert_subscription(
    p_user_id,
    v_plan_id,
    p_stripe_customer_id,
    p_subscription_tier,
    p_subscription_end,
    p_subscribed
  ) INTO v_result;
  
  -- Adicionar informações específicas do force sync
  v_result := v_result || jsonb_build_object('plan_slug', p_plan_slug);
  
  RETURN v_result;
END;
$$;

-- Criar função atômica para cancelamento
CREATE OR REPLACE FUNCTION public.atomic_cancel_subscription(
  p_user_id UUID,
  p_immediate BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cancelled_count INTEGER := 0;
  v_free_plan_id UUID;
  v_result jsonb;
BEGIN
  -- Lock user para evitar race conditions
  PERFORM 1 FROM auth.users WHERE id = p_user_id FOR UPDATE;
  
  IF p_immediate THEN
    -- Cancelamento imediato: cancelar e atribuir plano gratuito
    SELECT id INTO v_free_plan_id 
    FROM public.subscription_plans 
    WHERE slug = 'free' AND is_active = true;
    
    IF v_free_plan_id IS NULL THEN
      RAISE EXCEPTION 'Free plan not found';
    END IF;
    
    -- Usar função atômica para cancelar e inserir plano gratuito
    SELECT atomic_cancel_and_insert_subscription(
      p_user_id,
      v_free_plan_id,
      NULL, -- stripe_customer_id
      NULL, -- subscription_tier
      NULL, -- subscription_end
      false -- subscribed
    ) INTO v_result;
    
    v_result := v_result || jsonb_build_object(
      'message', 'Assinatura cancelada imediatamente. Você foi movido para o plano gratuito.',
      'immediate', true
    );
  ELSE
    -- Cancelamento no final do período: apenas marcar como cancelado
    UPDATE public.user_subscriptions 
    SET 
      status = 'cancelled',
      updated_at = now()
    WHERE 
      user_id = p_user_id 
      AND status = 'active';
      
    GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
    
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
      'subscription_cancelled_end_period',
      jsonb_build_object('cancelled_count', v_cancelled_count),
      jsonb_build_object('immediate', false)
    );
    
    v_result := jsonb_build_object(
      'success', true,
      'cancelled_count', v_cancelled_count,
      'message', 'Assinatura cancelada. Você terá acesso até o final do período de cobrança.',
      'immediate', false
    );
  END IF;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Atomic subscription cancellation failed: %', SQLERRM;
END;
$$;