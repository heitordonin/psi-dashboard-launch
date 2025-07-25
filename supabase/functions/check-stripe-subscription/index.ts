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
      logStep("No customer found, checking for free plan");
      
      // Verificar se usuário tem plano grátis ativo
      const { data: freePlan } = await supabaseClient
        .from("subscription_plans")
        .select("id")
        .eq("slug", "free")
        .single();

      if (freePlan) {
        // Cancelar assinaturas ativas existentes
        const { error: cancelError } = await supabaseClient
          .from("user_subscriptions")
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("status", "active");

        if (cancelError) {
          logStep("Error cancelling existing subscriptions", { error: cancelError });
        }

        // Inserir nova assinatura gratuita
        const { error: insertError } = await supabaseClient
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            plan_id: freePlan.id,
            status: 'active',
            starts_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          logStep("Error inserting free plan subscription", { error: insertError });
        }
      }

      return new Response(JSON.stringify({ 
        subscribed: false,
        plan_slug: "free",
        subscription_status: "active"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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

      // Buscar ID do plano no Supabase
      const { data: plan } = await supabaseClient
        .from("subscription_plans")
        .select("id")
        .eq("slug", planSlug)
        .single();

      if (plan) {
        // Primeiro cancelar todas as assinaturas ativas existentes para evitar conflitos
        const { error: cancelError } = await supabaseClient
          .from("user_subscriptions")
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("status", "active");

        if (cancelError) {
          logStep("Error cancelling existing subscriptions", { error: cancelError });
        }

        // Agora inserir a nova assinatura ativa
        const { error: insertError } = await supabaseClient
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            plan_id: plan.id,
            status: 'active',
            starts_at: subscriptionData.current_period_start,
            expires_at: subscriptionData.current_period_end,
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          logStep("Error inserting new subscription", { error: insertError });
          throw new Error(`Failed to create subscription: ${insertError.message}`);
        }

        logStep("Created new subscription in Supabase", { planId: plan.id, planSlug });
      }
    } else {
      logStep("No active subscription found");
      
      // Verificar se usuário tem plano grátis
      const { data: freePlan } = await supabaseClient
        .from("subscription_plans")
        .select("id")
        .eq("slug", "free")
        .single();

      if (freePlan) {
        // Cancelar assinaturas ativas existentes
        const { error: cancelError } = await supabaseClient
          .from("user_subscriptions")
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("status", "active");

        if (cancelError) {
          logStep("Error cancelling existing subscriptions for free plan", { error: cancelError });
        }

        // Inserir nova assinatura gratuita
        const { error: insertError } = await supabaseClient
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            plan_id: freePlan.id,
            status: 'active',
            starts_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          logStep("Error inserting free plan subscription", { error: insertError });
        }
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