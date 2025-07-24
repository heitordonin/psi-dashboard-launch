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
        // Atualizar/criar assinatura gratuita
        await supabaseClient.from("user_subscriptions").upsert({
          user_id: user.id,
          plan_id: freePlan.id,
          status: 'active',
          starts_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
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

    // Buscar assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let planSlug = "free";
    let subscriptionData = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end
      };

      // Determinar plano baseado no price ID
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;

      // Mapear baseado no valor (em centavos BRL)
      if (amount === 6900) { // R$69,00
        planSlug = "gestao";
      } else if (amount === 18900) { // R$189,00
        planSlug = "psi_regular";
      }

      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        planSlug,
        amount,
        priceId 
      });

      // Buscar ID do plano no Supabase
      const { data: plan } = await supabaseClient
        .from("subscription_plans")
        .select("id")
        .eq("slug", planSlug)
        .single();

      if (plan) {
        // Atualizar assinatura no Supabase
        await supabaseClient.from("user_subscriptions").upsert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'active',
          starts_at: subscriptionData.current_period_start,
          expires_at: subscriptionData.current_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        logStep("Updated subscription in Supabase", { planId: plan.id, planSlug });
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
        await supabaseClient.from("user_subscriptions").upsert({
          user_id: user.id,
          plan_id: freePlan.id,
          status: 'active',
          starts_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
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
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});