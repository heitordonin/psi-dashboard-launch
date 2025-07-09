import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { immediate = false } = await req.json();

    console.log(`[CANCEL-SUBSCRIPTION] Processing cancellation for user ${user.id}, immediate: ${immediate}`);

    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      throw new Error('No active subscription found');
    }

    // Se cancelamento imediato, cancelar agora
    // Se não, definir para cancelar no final do período
    const updateData = immediate 
      ? {
          status: 'cancelled',
          expires_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      : {
          status: 'cancelled',
          // Manter expires_at atual para continuar até o fim do período pago
          updated_at: new Date().toISOString()
        };

    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    if (updateError) {
      throw new Error(`Failed to cancel subscription: ${updateError.message}`);
    }

    // Se cancelamento imediato, atribuir plano grátis
    if (immediate) {
      const { data: freePlan } = await supabaseClient
        .from('subscription_plans')
        .select('id')
        .eq('slug', 'gratis')
        .single();

      if (freePlan) {
        await supabaseClient
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan_id: freePlan.id,
            status: 'active',
            starts_at: new Date().toISOString()
          });
      }
    }

    console.log(`[CANCEL-SUBSCRIPTION] Successfully cancelled subscription for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: immediate 
          ? 'Plano cancelado imediatamente' 
          : 'Plano será cancelado no final do período atual'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[CANCEL-SUBSCRIPTION] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});