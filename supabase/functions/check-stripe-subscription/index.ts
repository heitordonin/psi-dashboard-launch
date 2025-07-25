import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-STRIPE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Usar service role key para operações de escrita
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Função para retry com backoff exponencial
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number = 3): Promise<any> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        const waitTime = Math.pow(2, i) * 1000; // Backoff exponencial
        logStep(`Retry ${i + 1}/${maxRetries} after ${waitTime}ms`, { error: error.message });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Buscar cliente no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, using atomic function for free plan assignment");
      
      try {
        const { data: result, error: rpcError } = await supabaseClient
          .rpc('atomic_upsert_subscription', {
            p_user_id: user.id,
            p_plan_slug: 'free',
            p_stripe_customer_id: null,
            p_subscription_tier: null,
            p_subscription_end: null,
            p_subscribed: false
          });
        
        if (rpcError) {
          logStep("RPC Error in atomic free plan assignment", { error: rpcError });
          throw new Error(`Atomic operation failed: ${rpcError.message}`);
        }
        
        logStep("Free plan assigned atomically", { result });
        
        return new Response(JSON.stringify({ 
          subscribed: false,
          plan_slug: "free",
          subscription_status: "active"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (error) {
        logStep("ERROR in atomic free plan assignment", { error });
        throw error;
      }
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Buscar TODAS as assinaturas ativas para detectar múltiplas assinaturas
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100, // Buscar todas as assinaturas ativas
    });

    logStep("Found active subscriptions", { 
      count: subscriptions.data.length,
      subscriptions: subscriptions.data.map(s => ({ 
        id: s.id, 
        status: s.status,
        created: s.created,
        amount: s.items.data[0]?.price?.unit_amount
      }))
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let planSlug = "free";
    let subscriptionData = null;
    let activeSubscription = null;

    if (hasActiveSub) {
      // Se há múltiplas assinaturas, cancelar as antigas e manter apenas a mais recente
      if (subscriptions.data.length > 1) {
        logStep("Multiple active subscriptions detected - cleaning up", { 
          count: subscriptions.data.length
        });

        // Ordenar por data de criação (mais recente primeiro)
        const sortedSubscriptions = subscriptions.data.sort((a, b) => b.created - a.created);
        activeSubscription = sortedSubscriptions[0]; // Manter a mais recente
        
        // Cancelar as assinaturas antigas
        for (let i = 1; i < sortedSubscriptions.length; i++) {
          const oldSubscription = sortedSubscriptions[i];
          try {
            await stripe.subscriptions.cancel(oldSubscription.id);
            logStep("Cancelled old subscription", { 
              subscriptionId: oldSubscription.id,
              amount: oldSubscription.items.data[0]?.price?.unit_amount
            });
          } catch (cancelError) {
            logStep("Error cancelling old subscription", { 
              subscriptionId: oldSubscription.id,
              error: cancelError
            });
          }
        }
      } else {
        activeSubscription = subscriptions.data[0];
      }

      subscriptionData = {
        id: activeSubscription.id,
        status: activeSubscription.status,
        current_period_start: new Date(activeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: activeSubscription.cancel_at_period_end
      };

      // Determinar plano baseado no price ID
      const priceId = activeSubscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;

      // Mapear baseado no valor (em centavos BRL)
      if (amount === 6900) { // R$69,00
        planSlug = "gestao";
      } else if (amount === 18900) { // R$189,00
        planSlug = "psi_regular";
      }

      logStep("Active subscription found", { 
        subscriptionId: activeSubscription.id, 
        planSlug,
        amount,
        priceId 
      });

      // Verificar se há assinaturas existentes no Supabase antes de atualizar
      const { data: existingSubscriptions } = await supabaseClient
        .from("user_subscriptions")
        .select("id, plan_id, status")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        logStep("Found existing active subscriptions in Supabase", { 
          count: existingSubscriptions.length,
          subscriptions: existingSubscriptions 
        });
      }

      // Usar função atômica para atualizar assinatura
      try {
        const { data: result, error: rpcError } = await supabaseClient
          .rpc('atomic_upsert_subscription', {
            p_user_id: user.id,
            p_plan_slug: planSlug,
            p_stripe_customer_id: customerId,
            p_subscription_tier: planSlug,
            p_subscription_end: subscriptionData.current_period_end,
            p_subscribed: true
          });
        
        if (rpcError) {
          logStep("RPC Error in atomic subscription assignment", { error: rpcError });
          throw new Error(`Atomic operation failed: ${rpcError.message}`);
        }
        
        logStep("Subscription assigned atomically", { result, planSlug });
      } catch (error) {
        logStep("ERROR in atomic subscription assignment", { error });
        throw error;
      }
    } else {
      logStep("No active subscription found, using atomic function for free plan");
      
      try {
        const { data: result, error: rpcError } = await supabaseClient
          .rpc('atomic_upsert_subscription', {
            p_user_id: user.id,
            p_plan_slug: 'free',
            p_stripe_customer_id: customerId,
            p_subscription_tier: null,
            p_subscription_end: null,
            p_subscribed: false
          });
        
        if (rpcError) {
          logStep("RPC Error in atomic free plan assignment", { error: rpcError });
          throw new Error(`Atomic operation failed: ${rpcError.message}`);
        }
        
        logStep("Free plan assigned atomically (no active subscription)", { result });
      } catch (error) {
        logStep("ERROR in atomic free plan assignment", { error });
        throw error;
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_slug: planSlug,
      subscription_status: hasActiveSub ? "active" : "inactive",
      subscription_data: subscriptionData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-stripe-subscription", { message: errorMessage });
    
    // Return generic error message to prevent information disclosure
    const safeErrorMessage = errorMessage.includes('Authentication') 
      ? 'Authentication required' 
      : 'Unable to verify subscription status';
    
    return new Response(JSON.stringify({ error: safeErrorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && errorMessage.includes('Authentication') ? 401 : 500,
    });
  }
});