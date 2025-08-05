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

    // Criar cliente Supabase com service role para buscar dados do perfil
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    // Verificar se o email foi confirmado
    if (!user.email_confirmed_at) {
      logStep("Email not confirmed", { userId: user.id, email: user.email });
      throw new Error("Email not confirmed. Please check your inbox and confirm your email before proceeding with checkout.");
    }
    
    logStep("User authenticated and email confirmed", { 
      userId: user.id, 
      email: user.email,
      emailConfirmedAt: user.email_confirmed_at
    });

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    // Parse request body with validation
    const body = await req.json();
    const { 
      planSlug, 
      trial_days, 
      promotion_code, 
      allow_promotion_codes = true 
    } = body;
    
    // Validate input
    if (!planSlug || typeof planSlug !== 'string') {
      throw new Error("Valid plan slug is required");
    }
    
    // Validate plan slug against allowed values
    const allowedPlans = ['gestao', 'psi_regular'];
    if (!allowedPlans.includes(planSlug)) {
      throw new Error(`Invalid plan slug. Allowed values: ${allowedPlans.join(', ')}`);
    }

    // Validate optional parameters
    if (trial_days !== undefined && (typeof trial_days !== 'number' || trial_days < 0)) {
      throw new Error("trial_days must be a positive number");
    }
    if (promotion_code !== undefined && typeof promotion_code !== 'string') {
      throw new Error("promotion_code must be a string");
    }
    if (typeof allow_promotion_codes !== 'boolean') {
      throw new Error("allow_promotion_codes must be a boolean");
    }
    
    logStep("Request parameters received", { 
      planSlug, 
      trial_days, 
      promotion_code: promotion_code ? '[PROVIDED]' : undefined,
      allow_promotion_codes 
    });

    // Buscar dados do perfil do usuário para obter CPF e nome completo
    const { data: profileData, error: profileError } = await supabaseService
      .from('profiles')
      .select('cpf, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logStep("Error fetching user profile", { error: profileError });
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    if (!profileData?.cpf) {
      logStep("User CPF not found in profile", { userId: user.id });
      throw new Error("CPF is required for subscription. Please complete your profile.");
    }

    if (!profileData?.full_name) {
      logStep("User full name not found in profile", { userId: user.id });
      throw new Error("Full name is required for subscription. Please complete your profile.");
    }

    logStep("User profile data retrieved", { 
      userId: user.id, 
      hasCpf: !!profileData.cpf, 
      hasFullName: !!profileData.full_name 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verificar se o cliente já existe no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });

      // Atualizar metadados do cliente com CPF e nome completo
      await stripe.customers.update(customerId, {
        metadata: {
          user_id: user.id,
          cpf: profileData.cpf,
          full_name: profileData.full_name,
          plan_slug: planSlug
        }
      });
      logStep("Customer metadata updated", { customerId, cpf: profileData.cpf, full_name: profileData.full_name });

      // Verificar assinaturas ativas existentes e cancelar antes de criar nova
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 100,
      });

      if (existingSubscriptions.data.length > 0) {
        logStep("Found existing active subscriptions, cancelling them", { 
          count: existingSubscriptions.data.length,
          subscriptions: existingSubscriptions.data.map(s => ({ 
            id: s.id, 
            amount: s.items.data[0]?.price?.unit_amount 
          }))
        });

        // Cancelar todas as assinaturas ativas existentes
        for (const subscription of existingSubscriptions.data) {
          try {
            await stripe.subscriptions.cancel(subscription.id);
            logStep("Cancelled existing subscription", { 
              subscriptionId: subscription.id,
              amount: subscription.items.data[0]?.price?.unit_amount
            });
          } catch (cancelError) {
            logStep("Error cancelling existing subscription", { 
              subscriptionId: subscription.id,
              error: cancelError
            });
          }
        }
      }
    } else {
      logStep("No existing customer found");
    }

    // Get Price IDs from environment variables for security
    const gestaoPrice = Deno.env.get("STRIPE_PRICE_GESTAO");
    const psiRegularPrice = Deno.env.get("STRIPE_PRICE_PSI_REGULAR");
    
    const planPriceMap: Record<string, string> = {
      'gestao': gestaoPrice || '',
      'psi_regular': psiRegularPrice || '',
    };

    // Check if the specific plan's price ID is configured
    const priceId = planPriceMap[planSlug];
    if (!priceId) {
      throw new Error(`Price ID not configured for plan: ${planSlug}. Please set STRIPE_PRICE_${planSlug.toUpperCase()} environment variable.`);
    }

    logStep("Price ID mapped", { planSlug, priceId });

    // Configurar defaults de trial por plano
    const getDefaultTrialDays = (plan: string): number => {
      switch (plan) {
        case 'gestao':
          return parseInt(Deno.env.get("TRIAL_DAYS_GESTAO") || "7");
        case 'psi_regular':
          return parseInt(Deno.env.get("TRIAL_DAYS_PSI_REGULAR") || "7");
        default:
          return 0;
      }
    };

    // Determinar configurações finais
    const finalTrialDays = trial_days !== undefined ? trial_days : getDefaultTrialDays(planSlug);
    const finalAllowPromotions = allow_promotion_codes;

    logStep("Dynamic configuration determined", {
      finalTrialDays,
      finalAllowPromotions,
      hasPromotionCode: !!promotion_code
    });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Preparar metadata para eNotas
    const sessionMetadata = {
      user_id: user.id,
      plan_slug: planSlug,
      customer_document: profileData.cpf,
      customer_name: profileData.full_name
    };
    
    logStep("Metadata prepared for eNotas integration", sessionMetadata);

    // Preparar configurações dinâmicas da sessão
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/checkout/success?success=true&plan=${planSlug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/plans?canceled=true`,
      metadata: sessionMetadata
    };

    // Adicionar trial period se configurado
    if (finalTrialDays > 0) {
      sessionConfig.subscription_data = {
        trial_period_days: finalTrialDays
      };
      logStep("Trial period configured", { trial_period_days: finalTrialDays });
    }

    // Adicionar suporte a cupons se habilitado
    if (finalAllowPromotions) {
      sessionConfig.allow_promotion_codes = true;
      logStep("Promotion codes enabled");
    }

    // Adicionar código de promoção específico se fornecido
    if (promotion_code) {
      sessionConfig.discounts = [{ promotion_code }];
      logStep("Specific promotion code applied", { promotion_code });
    }
    
    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create(sessionConfig);

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