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

    try {
      const { data: result, error: rpcError } = await supabaseClient
        .rpc('atomic_cancel_subscription', {
          p_user_id: user.id,
          p_immediate: immediate
        });
      
      if (rpcError) {
        console.log(`[CANCEL-SUBSCRIPTION] RPC Error: ${rpcError.message}`);
        throw new Error(`Atomic operation failed: ${rpcError.message}`);
      }
      
      console.log(`[CANCEL-SUBSCRIPTION] Successfully cancelled subscription atomically for user ${user.id}`, { result });
      
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
      console.log(`[CANCEL-SUBSCRIPTION] ERROR in atomic cancellation: ${error.message}`);
      
      if (error.message.includes('Free plan not found')) {
        throw new Error('Plano gratuito não encontrado no sistema.');
      }
      
      throw error;
    }

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