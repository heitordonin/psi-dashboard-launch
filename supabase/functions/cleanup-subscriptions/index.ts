import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-SUBSCRIPTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Esta função deve ser pública (sem autenticação) para ser chamada por cron jobs
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Cleanup subscriptions started");

    // Executar cleanup das assinaturas antigas
    const { error: cleanupError } = await supabaseAdmin.rpc('cleanup_old_subscriptions');
    
    if (cleanupError) {
      logStep("Error in cleanup function", { error: cleanupError });
      throw new Error(`Cleanup failed: ${cleanupError.message}`);
    }

    // Verificar se há usuários com múltiplas assinaturas ativas e corrigir
    const { data: duplicates, error: duplicatesError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("user_id, count(*)")
      .eq("status", "active")
      .group("user_id")
      .having("count(*) > 1");

    if (duplicatesError) {
      logStep("Error checking duplicates", { error: duplicatesError });
    } else if (duplicates && duplicates.length > 0) {
      logStep("Found users with multiple active subscriptions", { 
        count: duplicates.length,
        users: duplicates 
      });

      // Corrigir duplicatas mantendo apenas a mais recente
      for (const duplicate of duplicates) {
        const { error: fixError } = await supabaseAdmin.rpc('sql', {
          query: `
            WITH duplicates AS (
              SELECT 
                user_id,
                id,
                ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
              FROM public.user_subscriptions 
              WHERE status = 'active' AND user_id = $1
            )
            UPDATE public.user_subscriptions 
            SET status = 'cancelled', updated_at = now()
            WHERE id IN (
              SELECT id FROM duplicates WHERE rn > 1
            )
          `,
          params: [duplicate.user_id]
        });

        if (fixError) {
          logStep("Error fixing duplicate for user", { 
            userId: duplicate.user_id, 
            error: fixError 
          });
        } else {
          logStep("Fixed duplicates for user", { userId: duplicate.user_id });
        }
      }
    }

    // Estatísticas finais
    const { data: stats, error: statsError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("status")
      .then(result => {
        if (result.error) return result;
        
        const counts = result.data.reduce((acc, sub) => {
          acc[sub.status] = (acc[sub.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return { data: counts, error: null };
      });

    if (statsError) {
      logStep("Error getting stats", { error: statsError });
    }

    logStep("Cleanup completed successfully", { stats });

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription cleanup completed",
      stats,
      duplicates_fixed: duplicates?.length || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cleanup", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});