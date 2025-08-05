import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const startTime = performance.now();
  console.log('[SYNC-EXPIRED-OVERRIDES] Function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[SYNC-EXPIRED-OVERRIDES] CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[SYNC-EXPIRED-OVERRIDES] Missing environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[SYNC-EXPIRED-OVERRIDES] Supabase client initialized');

    // Find expired overrides that are still active
    const { data: expiredOverrides, error: queryError } = await supabaseClient
      .from('subscription_overrides')
      .select('id, user_id, plan_slug, expires_at, reason')
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (queryError) {
      console.error('[SYNC-EXPIRED-OVERRIDES] Error querying expired overrides:', queryError);
      throw queryError;
    }

    console.log(`[SYNC-EXPIRED-OVERRIDES] Found ${expiredOverrides?.length || 0} expired overrides`);

    if (!expiredOverrides || expiredOverrides.length === 0) {
      const duration = performance.now() - startTime;
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No expired overrides found',
          processed: 0,
          execution_time_ms: Math.round(duration)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let processedCount = 0;
    let syncedCount = 0;
    const errors: Array<{ overrideId: string; error: string }> = [];

    // Process each expired override
    for (const override of expiredOverrides) {
      try {
        console.log(`[SYNC-EXPIRED-OVERRIDES] Processing expired override ${override.id} for user ${override.user_id}`);
        
        // Deactivate the expired override
        const { error: deactivateError } = await supabaseClient
          .from('subscription_overrides')
          .update({ 
            is_active: false, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', override.id);

        if (deactivateError) {
          console.error(`[SYNC-EXPIRED-OVERRIDES] Error deactivating override ${override.id}:`, deactivateError);
          errors.push({ overrideId: override.id, error: deactivateError.message });
          continue;
        }

        processedCount++;
        console.log(`[SYNC-EXPIRED-OVERRIDES] Deactivated expired override ${override.id}`);

        // Trigger subscription sync for the user
        try {
          const { error: syncError } = await supabaseClient.functions.invoke(
            'force-subscription-sync',
            {
              body: { 
                userId: override.user_id,
                triggerSource: 'expired_override_cleanup',
                overrideId: override.id
              }
            }
          );

          if (syncError) {
            console.warn(`[SYNC-EXPIRED-OVERRIDES] Sync failed for user ${override.user_id}:`, syncError);
            errors.push({ overrideId: override.id, error: `Sync failed: ${syncError.message}` });
          } else {
            syncedCount++;
            console.log(`[SYNC-EXPIRED-OVERRIDES] Successfully synced user ${override.user_id} after override expiry`);
          }
        } catch (syncError) {
          console.warn(`[SYNC-EXPIRED-OVERRIDES] Sync failed for user ${override.user_id}:`, syncError);
          errors.push({ overrideId: override.id, error: `Sync failed: ${syncError.message}` });
        }

      } catch (error) {
        console.error(`[SYNC-EXPIRED-OVERRIDES] Error processing override ${override.id}:`, error);
        errors.push({ overrideId: override.id, error: error.message });
      }
    }

    const duration = performance.now() - startTime;
    
    console.log(`[SYNC-EXPIRED-OVERRIDES] Processing completed in ${duration.toFixed(2)}ms`);
    console.log(`[SYNC-EXPIRED-OVERRIDES] Processed: ${processedCount}, Synced: ${syncedCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${processedCount} expired overrides`,
        processed: processedCount,
        synced: syncedCount,
        errors: errors,
        execution_time_ms: Math.round(duration),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('[SYNC-EXPIRED-OVERRIDES] Unexpected error:', {
      error: error.message,
      stack: error.stack,
      duration_ms: Math.round(duration)
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        execution_time_ms: Math.round(duration),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});