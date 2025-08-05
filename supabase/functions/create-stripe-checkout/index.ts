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

    // Parse request body primeiro para verificar se é guest checkout
    const body = await req.json();
    const { 
      planSlug, 
      trial_days, 
      promotion_code, 
      allow_promotion_codes = true,
      isGuestCheckout = false,
      postSignup = false, // Flag para checkout pós-signup
      userData = null // Dados do usuário para checkout pós-signup
    } = body;

    let user = null;
    let profileData = null;

    if (isGuestCheckout) {
      logStep("Guest checkout mode enabled");
      // Para guest checkout, vamos usar email temporário
      user = { 
        id: `guest_${Date.now()}`, 
        email: `guest_${Date.now()}@temp.psiclo.com.br` 
      };
      profileData = {
        cpf: null,
        full_name: null
      };
    } else if (postSignup && userData) {
      // Checkout pós-signup: usar dados fornecidos diretamente
      logStep("Post-signup checkout with user data", userData);
      user = {
        id: `temp_${Date.now()}`, // ID temporário
        email: userData.email
      };
      profileData = {
        cpf: userData.cpf,
        full_name: userData.full_name
      };
      
      logStep("Post-signup checkout - using provided user data", { 
        email: user.email,
        hasCpf: !!profileData.cpf, 
        hasFullName: !!profileData.full_name 
      });
    } else {
      // Fluxo normal com autenticação
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No authorization header provided");
      logStep("Authorization header found");

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      user = userData.user;
      if (!user?.email) throw new Error("User not authenticated or email not available");
      
      // Verificar se o email foi confirmado (exceto para checkout pós-signup)
      if (!user.email_confirmed_at && !postSignup) {
        logStep("Email not confirmed", { userId: user.id, email: user.email });
        throw new Error("Email not confirmed. Please check your inbox and confirm your email before proceeding with checkout.");
      }
      
      if (postSignup) {
        logStep("Post-signup checkout - bypassing email confirmation", { userId: user.id, email: user.email });
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

      // Buscar dados do perfil do usuário para obter CPF e nome completo
      const { data: profileDataResult, error: profileError } = await supabaseService
        .from('profiles')
        .select('cpf, full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        logStep("Error fetching user profile", { error: profileError });
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      if (!profileDataResult?.cpf) {
        logStep("User CPF not found in profile", { userId: user.id });
        throw new Error("CPF is required for subscription. Please complete your profile.");
      }

      if (!profileDataResult?.full_name) {
        logStep("User full name not found in profile", { userId: user.id });
        throw new Error("Full name is required for subscription. Please complete your profile.");
      }

      profileData = profileDataResult;
      
      logStep("User profile data retrieved", { 
        userId: user.id, 
        hasCpf: !!profileData.cpf, 
        hasFullName: !!profileData.full_name 
      });
    }
    
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
      allow_promotion_codes,
      isGuestCheckout 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verificar se o cliente já existe no Stripe (mesmo para checkout pós-signup)
    let customerId;
    if (!isGuestCheckout) {
      // Verificar se o cliente já existe no Stripe
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });

      // Verificar se já existe uma sessão de checkout ativa pendente
      const existingSessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 10,
      });

      const pendingSessions = existingSessions.data.filter(session => 
        session.status === 'open' && 
        session.expires_at > Math.floor(Date.now() / 1000) &&
        session.mode === 'subscription'
      );

      if (pendingSessions.length > 0) {
        const activeSession = pendingSessions[0];
        logStep("Found active pending checkout session", { 
          sessionId: activeSession.id,
          expiresAt: new Date(activeSession.expires_at * 1000).toISOString(),
          status: activeSession.status
        });

        // Retornar a sessão existente ao invés de criar uma nova
        return new Response(JSON.stringify({ 
          url: activeSession.url, 
          sessionId: activeSession.id,
          reused: true,
          message: "Returning existing checkout session"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

        // Atualizar metadados do cliente com CPF e nome completo
        try {
          await stripe.customers.update(customerId, {
            metadata: {
              user_id: postSignup ? userData?.email : user.id,
              cpf: profileData?.cpf || '',
              full_name: profileData?.full_name || '',
              plan_slug: planSlug
            }
          });
          logStep("Customer metadata updated", { customerId, cpf: profileData?.cpf, full_name: profileData?.full_name });
        } catch (updateError) {
          logStep("Error updating customer metadata", { customerId, error: updateError });
          // Não falhar por erro de metadados, apenas logar
        }

      // Verificar assinaturas ativas existentes
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 100,
      });

      if (existingSubscriptions.data.length > 0) {
        logStep("Found existing active subscriptions", { 
          count: existingSubscriptions.data.length,
          subscriptions: existingSubscriptions.data.map(s => ({ 
            id: s.id, 
            amount: s.items.data[0]?.price?.unit_amount,
            status: s.status,
            currentPeriodEnd: new Date(s.current_period_end * 1000).toISOString()
          }))
        });

      // Get Price IDs first to avoid usage before definition
      const gestaoPrice = Deno.env.get("STRIPE_PRICE_GESTAO");
      const psiRegularPrice = Deno.env.get("STRIPE_PRICE_PSI_REGULAR");
      
      const planPriceMap: Record<string, string> = {
        'gestao': gestaoPrice || '',
        'psi_regular': psiRegularPrice || '',
      };

      // Verificar se já tem uma assinatura para o mesmo plano
      const samePlanSubscription = existingSubscriptions.data.find(sub => {
        const existingPriceId = sub.items.data[0]?.price?.id;
        return existingPriceId === planPriceMap[planSlug];
      });

        if (samePlanSubscription) {
          logStep("User already has active subscription for this plan", {
            subscriptionId: samePlanSubscription.id,
            planSlug,
            currentPeriodEnd: new Date(samePlanSubscription.current_period_end * 1000).toISOString()
          });
          
          throw new Error(`You already have an active subscription for the ${planSlug} plan. Please cancel your current subscription or use the Customer Portal to manage it.`);
        }

        // Se é um plano diferente, cancelar assinaturas existentes antes de criar nova
        for (const subscription of existingSubscriptions.data) {
          try {
            await stripe.subscriptions.update(subscription.id, {
              cancel_at_period_end: true
            });
            logStep("Scheduled cancellation for existing subscription", { 
              subscriptionId: subscription.id,
              amount: subscription.items.data[0]?.price?.unit_amount,
              willCancelAt: new Date(subscription.current_period_end * 1000).toISOString()
            });
          } catch (cancelError) {
            logStep("Error scheduling cancellation for existing subscription", { 
              subscriptionId: subscription.id,
              error: cancelError
            });
            // Não falhar o processo por erro de cancelamento, apenas logar
          }
        }
        }
      } else {
        // Criar novo cliente com metadados completos
        try {
          const newCustomer = await stripe.customers.create({
            email: user.email,
            metadata: {
              user_id: postSignup ? userData?.email : user.id,
              cpf: profileData?.cpf || '',
              full_name: profileData?.full_name || '',
              plan_slug: planSlug
            }
          });
          customerId = newCustomer.id;
          logStep("New customer created with metadata", { 
            customerId, 
            email: user.email,
            cpf: profileData?.cpf, 
            full_name: profileData?.full_name 
          });
        } catch (createError) {
          logStep("Error creating new customer", { error: createError });
          // Continuar sem customer ID se falhar
        }
      }
    }

    // Get Price IDs 
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
    
    // Preparar metadata
    const sessionMetadata = {
      user_id: postSignup ? userData?.email : user.id, // Para pós-signup, usar email como identificador
      plan_slug: planSlug,
      customer_document: profileData?.cpf || '',
      customer_name: profileData?.full_name || '',
      customer_email: user.email, // Sempre incluir email para vinculação
      is_guest_checkout: isGuestCheckout,
      post_signup: postSignup
    };
    
    logStep("Metadata prepared", sessionMetadata);

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
      success_url: isGuestCheckout 
        ? `${origin}/post-checkout-signup?session_id={CHECKOUT_SESSION_ID}&plan=${planSlug}`
        : postSignup
        ? `${origin}/login` // Para pós-signup, redirecionar para login limpo sem parâmetros
        : `${origin}/checkout/success?success=true&plan=${planSlug}&session_id={CHECKOUT_SESSION_ID}`,
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