import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated or email not available');
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { immediate = false } = await req.json();
    logStep("Processing cancellation", { immediate });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, proceeding with local cancellation only");
    } else {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      // Find active subscriptions in Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });

      logStep("Found Stripe subscriptions", { count: subscriptions.data.length });

      // Cancel all active subscriptions in Stripe
      for (const subscription of subscriptions.data) {
        if (immediate) {
          // Cancel immediately
          await stripe.subscriptions.cancel(subscription.id);
          logStep("Cancelled subscription immediately in Stripe", { subscriptionId: subscription.id });
        } else {
          // Cancel at period end
          await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true
          });
          logStep("Scheduled subscription cancellation at period end in Stripe", { subscriptionId: subscription.id });
        }
      }
    }

    // Now cancel in the local database
    try {
      const { data: result, error: rpcError } = await supabaseClient
        .rpc('atomic_cancel_subscription', {
          p_user_id: user.id,
          p_immediate: immediate
        });
      
      if (rpcError) {
        logStep("RPC Error", { error: rpcError.message });
        throw new Error(`Atomic operation failed: ${rpcError.message}`);
      }
      
      logStep("Successfully cancelled subscription in database", { result });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: result.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      logStep("ERROR in atomic cancellation", { error: error.message });
      
      if (error.message.includes('Free plan not found')) {
        throw new Error('Plano gratuito não encontrado no sistema.');
      }
      
      throw error;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cancel-subscription", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});