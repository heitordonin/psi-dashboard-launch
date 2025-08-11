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
  console.log(`[BACKGROUND-JOB] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Background job started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    logStep("Stripe key verified");

    // Initialize Stripe and Supabase
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get all users with active subscriptions
    const { data: activeSubscriptions, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        user_id,
        subscription_plans (slug)
      `)
      .eq('status', 'active')
      .neq('subscription_plans.slug', 'free');

    if (subError) {
      logStep("Error fetching active subscriptions", { error: subError.message });
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    logStep("Fetched active subscriptions", { count: activeSubscriptions?.length || 0 });

    let processed = 0;
    let updated = 0;
    let errors = 0;

    // Process each active subscription
    for (const subscription of activeSubscriptions || []) {
      try {
        processed++;
        
        // Get user email
        const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(subscription.user_id);
        if (userError || !userData.user?.email) {
          logStep("Skipping user - no email found", { userId: subscription.user_id });
          continue;
        }

        const userEmail = userData.user.email;
        logStep("Processing user", { userId: subscription.user_id, email: userEmail });

        // Find Stripe customer
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length === 0) {
          logStep("No Stripe customer found", { email: userEmail });
          continue;
        }

        const customerId = customers.data[0].id;

        // Check active subscriptions in Stripe
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 10,
        });

        if (stripeSubscriptions.data.length === 0) {
          // No active subscription in Stripe - downgrade to free
          logStep("No active Stripe subscription - downgrading", { 
            userId: subscription.user_id,
            email: userEmail 
          });

          const { data: result, error: rpcError } = await supabaseClient
            .rpc('atomic_upsert_subscription', {
              p_user_id: subscription.user_id,
              p_plan_slug: 'free',
              p_stripe_customer_id: customerId,
              p_subscription_tier: null,
              p_subscription_end: null,
              p_subscribed: false
            });

          if (rpcError) {
            logStep("Failed to downgrade user", { 
              userId: subscription.user_id,
              error: rpcError.message 
            });
            errors++;
          } else {
            logStep("User downgraded successfully", { 
              userId: subscription.user_id,
              result 
            });
            updated++;
          }
        } else {
          // Has active subscription - verify it's correct
          const activeStripeSubscription = stripeSubscriptions.data[0];
          const priceId = activeStripeSubscription.items.data[0]?.price.id;
          
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId);
            const amount = price.unit_amount || 0;
            
            let expectedPlan = 'free';
            if (amount <= 6900) {
              expectedPlan = 'gestao';
            } else if (amount <= 24900) {
              expectedPlan = 'psi_regular';
            }

            const currentPlan = subscription.subscription_plans?.slug;
            
            if (currentPlan !== expectedPlan) {
              logStep("Plan mismatch detected - updating", {
                userId: subscription.user_id,
                currentPlan,
                expectedPlan,
                stripeAmount: amount
              });

              const subscriptionEnd = new Date(activeStripeSubscription.current_period_end * 1000).toISOString();

              const { data: result, error: rpcError } = await supabaseClient
                .rpc('atomic_upsert_subscription', {
                  p_user_id: subscription.user_id,
                  p_plan_slug: expectedPlan,
                  p_stripe_customer_id: customerId,
                  p_subscription_tier: expectedPlan,
                  p_subscription_end: subscriptionEnd,
                  p_subscribed: true
                });

              if (rpcError) {
                logStep("Failed to update user plan", { 
                  userId: subscription.user_id,
                  error: rpcError.message 
                });
                errors++;
              } else {
                logStep("User plan updated successfully", { 
                  userId: subscription.user_id,
                  result 
                });
                updated++;
              }
            } else {
              logStep("User subscription is correct", { 
                userId: subscription.user_id,
                plan: currentPlan 
              });
            }
          }
        }
      } catch (error) {
        errors++;
        logStep("Error processing user", {
          userId: subscription.user_id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const summary = {
      processed,
      updated,
      errors,
      timestamp: new Date().toISOString()
    };

    logStep("Background job completed", summary);

    return new Response(JSON.stringify({
      success: true,
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in background job", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});