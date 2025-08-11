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
      // Buscar assinaturas por email caso não encontre customer (checkout pós-signup)
      logStep("No customer found, searching for subscriptions by email");
      
      const allCustomers = await stripe.customers.list({ limit: 100 });
      const customerByEmail = allCustomers.data.find(c => c.email === user.email);
      
      if (customerByEmail) {
        logStep("Found customer by email search", { customerId: customerByEmail.id });
        // Continuar com a lógica normal usando o customer encontrado
        const customerId = customerByEmail.id;
        
        // Buscar assinaturas deste customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 100,
        });
        
        const activeSubscriptions = subscriptions.data.filter(
          sub => sub.status === "active" || sub.status === "trialing"
        );
        
        if (activeSubscriptions.length > 0) {
          logStep("Found active subscriptions for customer found by email", { 
            customerId,
            activeCount: activeSubscriptions.length 
          });
          
          // Processar a assinatura ativa (usar a lógica já existente)
          const activeSubscription = activeSubscriptions[0];
          const priceId = activeSubscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const amount = price.unit_amount || 0;
          
          const gestaoPriceId = Deno.env.get('STRIPE_PRICE_GESTAO');
          const psiRegularPriceId = Deno.env.get('STRIPE_PRICE_PSI_REGULAR');
          
          let planSlug = "free";
          if (priceId === gestaoPriceId) {
            planSlug = "gestao";
          } else if (priceId === psiRegularPriceId) {
            planSlug = "psi_regular";
          } else if (amount === 4900) {
            planSlug = "gestao";
          } else if (amount === 24900) {
            planSlug = "psi_regular";
          }
          
          const subscriptionData = {
            id: activeSubscription.id,
            status: activeSubscription.status,
            current_period_start: new Date(activeSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: activeSubscription.cancel_at_period_end
          };
          
          // Usar função atômica para vincular a assinatura ao usuário
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
            logStep("RPC Error in post-signup subscription linking", { error: rpcError });
            throw new Error(`Atomic operation failed: ${rpcError.message}`);
          }
          
          logStep("Post-signup subscription linked successfully", { 
            result, 
            planSlug,
            customerId,
            subscriptionId: activeSubscription.id 
          });
          
          return new Response(JSON.stringify({
            subscribed: true,
            plan_slug: planSlug,
            subscription_status: activeSubscription.status,
            subscription_data: subscriptionData,
            linked_post_signup: true
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
      
      logStep("No customer found by email, using atomic function for free plan assignment");
      
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

    // Buscar TODAS as assinaturas ativas e em trial para detectar múltiplas assinaturas
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all", // Buscar todas para filtrar manualmente
      limit: 100,
    });

    // Filtrar apenas as assinaturas que consideramos "ativas" (active ou trialing)
    const activeSubscriptions = subscriptions.data.filter(
      sub => sub.status === "active" || sub.status === "trialing"
    );

    logStep("Found active/trialing subscriptions", { 
      totalCount: subscriptions.data.length,
      activeCount: activeSubscriptions.length,
      subscriptions: activeSubscriptions.map(s => ({ 
        id: s.id, 
        status: s.status,
        created: s.created,
        amount: s.items.data[0]?.price?.unit_amount,
        trial_end: s.trial_end
      }))
    });

    const hasActiveSub = activeSubscriptions.length > 0;
    let planSlug = "free";
    let subscriptionData = null;
    let activeSubscription = null;

    if (hasActiveSub) {
      // Se há múltiplas assinaturas, cancelar as antigas e manter apenas a mais recente
      if (activeSubscriptions.length > 1) {
        logStep("Multiple active/trialing subscriptions detected - cleaning up", { 
          count: activeSubscriptions.length
        });

        // Ordenar por data de criação (mais recente primeiro)
        const sortedSubscriptions = activeSubscriptions.sort((a, b) => b.created - a.created);
        activeSubscription = sortedSubscriptions[0]; // Manter a mais recente
        
        // Cancelar as assinaturas antigas
        for (let i = 1; i < sortedSubscriptions.length; i++) {
          const oldSubscription = sortedSubscriptions[i];
          try {
            await stripe.subscriptions.cancel(oldSubscription.id);
            logStep("Cancelled old subscription", { 
              subscriptionId: oldSubscription.id,
              status: oldSubscription.status,
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
        activeSubscription = activeSubscriptions[0];
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

      // Obter price IDs das variáveis de ambiente primeiro
      const gestaoPriceId = Deno.env.get('STRIPE_PRICE_GESTAO');
      const psiRegularPriceId = Deno.env.get('STRIPE_PRICE_PSI_REGULAR');
      
      // Mapear baseado no price ID (mais confiável)
      if (priceId === gestaoPriceId) {
        planSlug = "gestao";
      } else if (priceId === psiRegularPriceId) {
        planSlug = "psi_regular";
      } else {
        // Fallback para mapear baseado no valor (em centavos BRL)
        if (amount === 4900) { // R$49,00
          planSlug = "gestao";
        } else if (amount === 24900) { // R$249,00
          planSlug = "psi_regular";
        }
        
        logStep("Used amount fallback for plan mapping", { 
          priceId, 
          amount, 
          planSlug,
          gestaoPriceId,
          psiRegularPriceId 
        });
      }

      logStep("Active/trialing subscription found", { 
        subscriptionId: activeSubscription.id, 
        status: activeSubscription.status,
        planSlug,
        amount,
        priceId,
        trial_end: activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1000).toISOString() : null
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
      subscription_status: hasActiveSub ? activeSubscription?.status || "active" : "inactive",
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