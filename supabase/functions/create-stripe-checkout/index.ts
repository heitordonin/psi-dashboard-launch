import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting for checkout operations
const rateLimitStore = new Map();
const RATE_LIMIT_MAX = 5; // Max 5 checkout attempts per hour per user
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(userId);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STRIPE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Criar cliente Supabase para autenticação
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    // Parse request body with validation
    const body = await req.json();
    const { planSlug } = body;
    
    // Validate input
    if (!planSlug || typeof planSlug !== 'string') {
      throw new Error("Valid plan slug is required");
    }
    
    // Validate plan slug against allowed values
    const allowedPlans = ['gestao', 'psi_regular'];
    if (!allowedPlans.includes(planSlug)) {
      throw new Error(`Invalid plan slug. Allowed values: ${allowedPlans.join(', ')}`);
    }
    
    logStep("Plan slug received", { planSlug });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verificar se o cliente já existe no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Get Price IDs from environment variables for security
    const gestaoPrice = Deno.env.get("STRIPE_PRICE_GESTAO");
    const psiRegularPrice = Deno.env.get("STRIPE_PRICE_PSI_REGULAR");
    
    if (!gestaoPrice || !psiRegularPrice) {
      throw new Error("Stripe Price IDs not configured. Please set STRIPE_PRICE_GESTAO and STRIPE_PRICE_PSI_REGULAR environment variables.");
    }
    
    const planPriceMap: Record<string, string> = {
      'gestao': gestaoPrice,
      'psi_regular': psiRegularPrice,
    };

    const priceId = planPriceMap[planSlug];
    if (!priceId) throw new Error(`No price configured for plan: ${planSlug}`);
    logStep("Price ID mapped", { planSlug, priceId });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/plans?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_slug: planSlug
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-stripe-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});