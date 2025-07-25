import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FORCE-SYNC] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Force sync started");

    const { userId } = await req.json();
    if (!userId) throw new Error("User ID is required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Buscar email do usuário
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const { data: authUser } = await supabaseClient.auth.admin.getUserById(userId);
    if (!authUser.user?.email) throw new Error("User email not found");

    const userEmail = authUser.user.email;
    logStep("Found user", { userId, email: userEmail });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Buscar cliente no Stripe
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, using atomic function for free plan");
      
      try {
        const { data: result, error: rpcError } = await supabaseClient
          .rpc('atomic_upsert_subscription', {
            p_user_id: userId,
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
          success: true, 
          plan: "free",
          message: "User set to free plan - no Stripe customer found"
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

    // Buscar assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    logStep("Found subscriptions", { 
      count: subscriptions.data.length,
      subscriptions: subscriptions.data.map(s => ({ 
        id: s.id, 
        status: s.status,
        amount: s.items.data[0]?.price?.unit_amount
      }))
    });

    if (subscriptions.data.length === 0) {
      logStep("No active Stripe subscriptions found, using atomic function for free plan");
      
      try {
        const { data: result, error: rpcError } = await supabaseClient
          .rpc('atomic_upsert_subscription', {
            p_user_id: userId,
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
        
        logStep("Free plan assigned atomically", { result });
        
        return new Response(JSON.stringify({ 
          success: true, 
          plan: "free",
          message: "No active Stripe subscriptions found"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (error) {
        logStep("ERROR in atomic free plan assignment", { error });
        throw error;
      }
    }

    // Pegar a assinatura mais recente
    const activeSubscription = subscriptions.data.sort((a, b) => b.created - a.created)[0];
    const priceId = activeSubscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;

    // Mapear baseado no valor
    let planSlug = "free";
    if (amount === 6900) { // R$69,00
      planSlug = "gestao";
    } else if (amount === 18900) { // R$189,00
      planSlug = "psi_regular";
    }

    logStep("Determined plan", { planSlug, amount, priceId });

    try {
      const { data: result, error: rpcError } = await supabaseClient
        .rpc('atomic_upsert_subscription', {
          p_user_id: userId,
          p_plan_slug: planSlug,
          p_stripe_customer_id: customerId,
          p_subscription_tier: planSlug,
          p_subscription_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
          p_subscribed: true
        });
      
      if (rpcError) {
        logStep("RPC Error in atomic subscription sync", { error: rpcError });
        throw new Error(`Atomic operation failed: ${rpcError.message}`);
      }
      
      logStep("Subscription synced atomically", { result, planSlug });
    } catch (error) {
      logStep("ERROR in atomic subscription sync", { error });
      throw error;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      plan: planSlug,
      subscription_id: activeSubscription.id,
      message: "Subscription successfully synced"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in force sync", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});