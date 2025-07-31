import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    
    logStep("Stripe keys verified");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Initialize Supabase with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // Check for duplicate events using event ID
    const eventId = event.id;
    const { data: existingEvent } = await supabaseClient
      .from('admin_audit_log')
      .select('id')
      .eq('action', 'stripe_webhook_processed')
      .eq('old_value->event_id', eventId)
      .single();

    if (existingEvent) {
      logStep("Duplicate event detected, skipping", { eventId });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Process different event types
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Processing subscription event", { 
          eventType: event.type, 
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId,
          cancelAtPeriodEnd: subscription.cancel_at_period_end 
        });

        try {
          // Get customer email
          const customer = await stripe.customers.retrieve(customerId);
          if (!customer || customer.deleted) {
            logStep("Customer not found or deleted", { customerId });
            break;
          }

          const customerEmail = (customer as Stripe.Customer).email;
          if (!customerEmail) {
            logStep("Customer has no email", { customerId });
            break;
          }

          // Find user by email
          const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
          if (userError) {
            logStep("Error fetching users", { error: userError.message });
            break;
          }

          const user = users.users.find(u => u.email === customerEmail);
          if (!user) {
            logStep("User not found for email", { email: customerEmail });
            break;
          }

          // Determine plan based on subscription status and price ID
          let planSlug = 'free';
          let subscribed = false;
          let subscriptionEnd: string | null = null;

          if ((subscription.status === 'active' || subscription.status === 'trialing') && subscription.items.data.length > 0) {
            const priceId = subscription.items.data[0].price.id;
            
            // Get price IDs from environment variables
            const gestaoPriceId = Deno.env.get('STRIPE_PRICE_GESTAO');
            const psiRegularPriceId = Deno.env.get('STRIPE_PRICE_PSI_REGULAR');
            
            subscribed = true;
            subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

            // Map price IDs to plan slugs (more reliable than amounts)
            if (priceId === gestaoPriceId) {
              planSlug = 'gestao';
            } else if (priceId === psiRegularPriceId) {
              planSlug = 'psi_regular';
            } else {
              // Fallback to amount-based mapping if price ID doesn't match
              const price = await stripe.prices.retrieve(priceId);
              const amount = price.unit_amount || 0;
              
              if (amount <= 6900) { // R$ 69
                planSlug = 'gestao';
              } else if (amount <= 18900) { // R$ 189
                planSlug = 'psi_regular';
              }
              
              logStep("Unrecognized price ID, used amount fallback", { 
                priceId, 
                amount, 
                planSlug,
                gestaoPriceId,
                psiRegularPriceId 
              });
            }

            logStep("Active/trialing subscription mapped", { 
              planSlug, 
              status: subscription.status,
              subscriptionEnd,
              priceId,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
            });
          } else if (subscription.status === 'canceled' || event.type === 'customer.subscription.deleted') {
            logStep("Cancelled/deleted subscription - using free plan", { 
              status: subscription.status 
            });
          } else {
            logStep("Inactive subscription - using free plan", { 
              status: subscription.status 
            });
          }

          // Update subscription in database
          const { data: result, error: rpcError } = await supabaseClient
            .rpc('atomic_upsert_subscription', {
              p_user_id: user.id,
              p_plan_slug: planSlug,
              p_stripe_customer_id: customerId,
              p_subscription_tier: planSlug === 'gestao' ? 'Gestão' : planSlug === 'psi_regular' ? 'Psi Regular' : null,
              p_subscription_end: subscriptionEnd,
              p_subscribed: subscribed
            });

          if (rpcError) {
            logStep("Database update failed", { error: rpcError.message });
            throw new Error(`Database update failed: ${rpcError.message}`);
          }

          // Handle cancel_at_period_end flag separately
          if (subscription.cancel_at_period_end && subscription.status === 'active') {
            const { error: cancelError } = await supabaseClient
              .from('user_subscriptions')
              .update({ 
                cancel_at_period_end: true, 
                updated_at: new Date().toISOString() 
              })
              .eq('user_id', user.id)
              .eq('status', 'active');
            
            if (cancelError) {
              logStep("Error updating cancel_at_period_end", { error: cancelError.message });
            } else {
              logStep("Marked subscription as cancelled at period end", { userId: user.id });
            }
          }

          logStep("Subscription updated successfully", { 
            userId: user.id,
            result 
          });

          // Log successful processing to prevent duplicates
          await supabaseClient
            .from('admin_audit_log')
            .insert({
              user_id: user.id,
              admin_user_id: user.id,
              action: 'stripe_webhook_processed',
              old_value: { event_id: eventId, event_type: event.type },
              new_value: { plan_slug: planSlug, subscribed, result }
            });

        } catch (subscriptionError) {
          logStep("Error processing subscription event", { 
            error: subscriptionError.message,
            subscriptionId: subscription.id 
          });
          throw subscriptionError;
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        logStep("Processing payment failure", { 
          invoiceId: invoice.id,
          customerId,
          attemptCount: invoice.attempt_count 
        });

        // Get customer email
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer || customer.deleted) {
          logStep("Customer not found for payment failure", { customerId });
          break;
        }

        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) {
          logStep("Customer has no email for payment failure", { customerId });
          break;
        }

        // Find user by email
        const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
        if (userError) {
          logStep("Error fetching users for payment failure", { error: userError.message });
          break;
        }

        const user = users.users.find(u => u.email === customerEmail);
        if (!user) {
          logStep("User not found for payment failure", { email: customerEmail });
          break;
        }

        // If this is the final attempt (usually 3rd), downgrade to free
        if (invoice.attempt_count >= 3) {
          logStep("Final payment attempt failed, downgrading to free", { 
            userId: user.id,
            attemptCount: invoice.attempt_count 
          });

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
            logStep("Failed to downgrade user to free plan", { error: rpcError.message });
          } else {
            logStep("User downgraded to free plan due to payment failure", { 
              userId: user.id,
              result 
            });
          }
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          logStep("Payment succeeded, refreshing subscription", { 
            invoiceId: invoice.id,
            subscriptionId 
          });

          // Get subscription details and trigger update
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // This will trigger the subscription.updated webhook
          logStep("Subscription retrieved for payment success", { 
            subscriptionId,
            status: subscription.status 
          });
        }

        break;
      }

      default:
        logStep("Unhandled webhook event", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});