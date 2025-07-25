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
      logStep("No Stripe customer found - setting free plan");
      
      // Cancelar todas as assinaturas
      await supabaseClient
        .from("user_subscriptions")
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "active");

      // Buscar plano grátis
      const { data: freePlan } = await supabaseClient
        .from("subscription_plans")
        .select("id")
        .eq("slug", "free")
        .single();

      if (freePlan) {
        await supabaseClient
          .from("user_subscriptions")
          .insert({
            user_id: userId,
            plan_id: freePlan.id,
            status: 'active',
            starts_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        plan: "free",
        message: "User set to free plan - no Stripe customer found"
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

    // Cancelar todas as assinaturas antigas no Supabase primeiro
    await supabaseClient
      .from("user_subscriptions")
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "active");

    if (subscriptions.data.length === 0) {
      // Nenhuma assinatura ativa - definir plano grátis
      const { data: freePlan } = await supabaseClient
        .from("subscription_plans")
        .select("id")
        .eq("slug", "free")
        .single();

      if (freePlan) {
        await supabaseClient
          .from("user_subscriptions")
          .insert({
            user_id: userId,
            plan_id: freePlan.id,
            status: 'active',
            starts_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        plan: "free",
        message: "No active Stripe subscriptions found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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

    // Buscar ID do plano no Supabase
    const { data: plan } = await supabaseClient
      .from("subscription_plans")
      .select("id")
      .eq("slug", planSlug)
      .single();

    if (plan) {
      // Inserir nova assinatura
      const { error: insertError } = await supabaseClient
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          starts_at: new Date(activeSubscription.current_period_start * 1000).toISOString(),
          expires_at: new Date(activeSubscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        logStep("Error inserting subscription", { error: insertError });
        throw insertError;
      }

      logStep("Successfully synced subscription", { planSlug, subscriptionId: activeSubscription.id });
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