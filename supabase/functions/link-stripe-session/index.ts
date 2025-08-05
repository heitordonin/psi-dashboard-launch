import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LINK-STRIPE-SESSION] ${step}${detailsStr}`);
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

    // Usar service role para operações privilegiadas
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Autenticar usuário atual
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const body = await req.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    
    logStep("Received session ID", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Buscar dados do perfil do usuário
    const { data: profileData, error: profileError } = await supabaseService
      .from('profiles')
      .select('cpf, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logStep("Error fetching user profile", { error: profileError });
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    logStep("User profile data retrieved", { 
      userId: user.id, 
      hasCpf: !!profileData?.cpf, 
      hasFullName: !!profileData?.full_name 
    });

    // Buscar a sessão do Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      logStep("Stripe session retrieved", { 
        sessionId: session.id, 
        status: session.status,
        customerId: session.customer,
        customerEmail: session.customer_details?.email 
      });
    } catch (error) {
      logStep("Error retrieving Stripe session", { sessionId, error });
      throw new Error(`Failed to retrieve Stripe session: ${error.message}`);
    }

    // Verificar se a sessão está válida
    if (session.status !== 'complete') {
      logStep("Session not completed", { sessionId, status: session.status });
      throw new Error(`Session is not completed. Current status: ${session.status}`);
    }

    // Atualizar metadados da sessão
    try {
      await stripe.checkout.sessions.update(sessionId, {
        metadata: {
          ...session.metadata,
          user_id: user.id, // Substituir o ID temporário pelo real
          customer_document: profileData?.cpf || '',
          customer_name: profileData?.full_name || '',
          customer_email: user.email,
          linked_at: new Date().toISOString()
        }
      });
      logStep("Session metadata updated", { sessionId, userId: user.id });
    } catch (error) {
      logStep("Error updating session metadata", { sessionId, error });
      // Não falhar por erro de metadados, apenas logar
    }

    // Atualizar customer no Stripe se existir
    if (session.customer) {
      try {
        let customerId = session.customer as string;
        
        // Buscar customer atual para verificar dados
        const currentCustomer = await stripe.customers.retrieve(customerId);
        logStep("Current customer data", { 
          customerId, 
          email: (currentCustomer as any).email,
          metadata: (currentCustomer as any).metadata 
        });

        // Atualizar customer com dados reais do usuário
        await stripe.customers.update(customerId, {
          email: user.email, // Garantir que o email está correto
          metadata: {
            user_id: user.id,
            cpf: profileData?.cpf || '',
            full_name: profileData?.full_name || '',
            linked_at: new Date().toISOString()
          }
        });
        logStep("Customer updated with real user data", { customerId, userId: user.id });

        // Se existe subscription associada, atualizar metadados também
        if (session.subscription) {
          try {
            await stripe.subscriptions.update(session.subscription as string, {
              metadata: {
                user_id: user.id,
                customer_document: profileData?.cpf || '',
                customer_name: profileData?.full_name || '',
                linked_at: new Date().toISOString()
              }
            });
            logStep("Subscription metadata updated", { 
              subscriptionId: session.subscription, 
              userId: user.id 
            });
          } catch (subError) {
            logStep("Error updating subscription metadata", { 
              subscriptionId: session.subscription, 
              error: subError 
            });
          }
        }

      } catch (error) {
        logStep("Error updating customer", { customerId: session.customer, error });
        // Não falhar por erro de customer, apenas logar
      }
    }

    logStep("Session successfully linked", { 
      sessionId, 
      userId: user.id, 
      customerEmail: user.email 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Session successfully linked to user",
      sessionId,
      userId: user.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in link-stripe-session", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});