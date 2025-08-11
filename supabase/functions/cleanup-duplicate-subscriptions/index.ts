import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-DUPLICATE-SUBSCRIPTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key for administrative operations
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

    // Find the customer in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No Stripe customer found for this user",
        cleanedUp: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100,
    });

    logStep("Found active subscriptions", { 
      count: subscriptions.data.length,
      subscriptions: subscriptions.data.map(s => ({ 
        id: s.id, 
        status: s.status,
        created: s.created,
        amount: s.items.data[0]?.price?.unit_amount,
        priceId: s.items.data[0]?.price?.id
      }))
    });

    let cleanupActions = [];

    if (subscriptions.data.length > 1) {
      // Sort by creation date (newest first) and amount (highest first)
      const sortedSubscriptions = subscriptions.data.sort((a, b) => {
        const amountA = a.items.data[0]?.price?.unit_amount || 0;
        const amountB = b.items.data[0]?.price?.unit_amount || 0;
        
        // First sort by amount (higher value plans preferred)
        if (amountA !== amountB) {
          return amountB - amountA;
        }
        
        // Then by creation date (newer preferred)
        return b.created - a.created;
      });

      const keepSubscription = sortedSubscriptions[0];
      const cancelSubscriptions = sortedSubscriptions.slice(1);

      logStep("Cleanup plan", {
        keeping: {
          id: keepSubscription.id,
          amount: keepSubscription.items.data[0]?.price?.unit_amount,
          created: keepSubscription.created
        },
        cancelling: cancelSubscriptions.map(s => ({
          id: s.id,
          amount: s.items.data[0]?.price?.unit_amount,
          created: s.created
        }))
      });

      // Cancel the old subscriptions
      for (const subscription of cancelSubscriptions) {
        try {
          await stripe.subscriptions.cancel(subscription.id);
          cleanupActions.push({
            action: "cancelled_subscription",
            subscriptionId: subscription.id,
            amount: subscription.items.data[0]?.price?.unit_amount,
            success: true
          });
          logStep("Cancelled old subscription", { 
            subscriptionId: subscription.id,
            amount: subscription.items.data[0]?.price?.unit_amount
          });
        } catch (cancelError) {
          cleanupActions.push({
            action: "failed_to_cancel_subscription",
            subscriptionId: subscription.id,
            error: cancelError,
            success: false
          });
          logStep("Error cancelling old subscription", { 
            subscriptionId: subscription.id,
            error: cancelError
          });
        }
      }

      // Update the database with the correct subscription
      const priceId = keepSubscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;

      let planSlug = "free";
      if (amount === 6900) { // R$69,00
        planSlug = "gestao";
      } else if (amount === 24900) { // R$249,00
        planSlug = "psi_regular";
      }

      // Get the plan ID from Supabase
      const { data: plan } = await supabaseClient
        .from("subscription_plans")
        .select("id")
        .eq("slug", planSlug)
        .single();

      if (plan) {
        // Update the user's subscription in Supabase
        const { error: upsertError } = await supabaseClient.from("user_subscriptions").upsert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'active',
          starts_at: new Date(keepSubscription.current_period_start * 1000).toISOString(),
          expires_at: new Date(keepSubscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

        if (upsertError) {
          logStep("Error updating subscription in database", { error: upsertError });
        } else {
          cleanupActions.push({
            action: "updated_database",
            planSlug: planSlug,
            planId: plan.id,
            success: true
          });
          logStep("Updated subscription in database", { planSlug, planId: plan.id });
        }
      }
    } else if (subscriptions.data.length === 1) {
      logStep("Only one active subscription found - no cleanup needed");
      cleanupActions.push({
        action: "no_cleanup_needed",
        message: "Only one active subscription found",
        success: true
      });
    } else {
      logStep("No active subscriptions found");
      cleanupActions.push({
        action: "no_active_subscriptions",
        message: "No active subscriptions found",
        success: true
      });
    }

    return new Response(JSON.stringify({
      message: "Cleanup completed",
      cleanedUp: cleanupActions.length > 0,
      actions: cleanupActions,
      subscriptionsFound: subscriptions.data.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cleanup-duplicate-subscriptions", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: "Failed to cleanup subscriptions",
      details: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});