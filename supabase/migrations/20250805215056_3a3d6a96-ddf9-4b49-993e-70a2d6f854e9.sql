-- Create subscription_overrides table for courtesy plans
CREATE TABLE public.subscription_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_slug TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  reason TEXT NOT NULL,
  created_by_admin_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.subscription_overrides ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all subscription overrides" 
ON public.subscription_overrides 
FOR ALL 
USING (is_admin(auth.uid())) 
WITH CHECK (is_admin(auth.uid()));

-- Index for performance
CREATE INDEX idx_subscription_overrides_user_id ON public.subscription_overrides(user_id);
CREATE INDEX idx_subscription_overrides_active ON public.subscription_overrides(is_active, expires_at);

-- Function to check if user has active override
CREATE OR REPLACE FUNCTION public.get_active_subscription_override(p_user_id UUID)
RETURNS TABLE(plan_slug TEXT, expires_at TIMESTAMP WITH TIME ZONE, reason TEXT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    so.plan_slug,
    so.expires_at,
    so.reason
  FROM public.subscription_overrides so
  WHERE so.user_id = p_user_id
    AND so.is_active = true
    AND (so.expires_at IS NULL OR so.expires_at > now())
  ORDER BY so.created_at DESC
  LIMIT 1;
END;
$$;

-- Update atomic_upsert_subscription to check for overrides first
CREATE OR REPLACE FUNCTION public.atomic_upsert_subscription(
  p_user_id uuid, 
  p_plan_slug text, 
  p_stripe_customer_id text DEFAULT NULL::text, 
  p_subscription_tier text DEFAULT NULL::text, 
  p_subscription_end timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_subscribed boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_plan_id UUID;
  v_existing_subscription_id UUID;
  v_operation_type TEXT := 'insert';
  v_result jsonb;
  v_override_plan_slug TEXT;
  v_override_expires_at TIMESTAMP WITH TIME ZONE;
  v_override_reason TEXT;
BEGIN
  -- Lock user para evitar race conditions
  PERFORM 1 FROM auth.users WHERE id = p_user_id FOR UPDATE;
  
  -- First check for active subscription override
  SELECT plan_slug, expires_at, reason 
  INTO v_override_plan_slug, v_override_expires_at, v_override_reason
  FROM public.get_active_subscription_override(p_user_id);
  
  -- If override exists, use it instead of Stripe plan
  IF v_override_plan_slug IS NOT NULL THEN
    p_plan_slug := v_override_plan_slug;
    p_subscription_end := v_override_expires_at;
    p_subscription_tier := 'courtesy';
  END IF;
  
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
      'plan_slug', p_plan_slug,
      'is_courtesy', v_override_plan_slug IS NOT NULL,
      'courtesy_reason', v_override_reason
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
      'plan_slug', p_plan_slug,
      'is_courtesy', v_override_plan_slug IS NOT NULL,
      'courtesy_reason', v_override_reason
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