import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionOverride {
  id: string;
  user_id: string;
  plan_slug: string;
  expires_at: string | null;
  reason: string;
  created_at: string;
  is_active: boolean;
  profiles: {
    full_name: string | null;
    display_name: string | null;
  };
  user_email: string;
}

Deno.serve(async (req) => {
  const startTime = performance.now();
  console.log('[GET-SUBSCRIPTION-OVERRIDES] Function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[GET-SUBSCRIPTION-OVERRIDES] CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request method
  if (req.method !== 'GET') {
    console.error('[GET-SUBSCRIPTION-OVERRIDES] Invalid method:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[GET-SUBSCRIPTION-OVERRIDES] Missing environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[GET-SUBSCRIPTION-OVERRIDES] Supabase client initialized');

    // Get subscription overrides with separate queries to avoid relationship issues
    console.log('[GET-SUBSCRIPTION-OVERRIDES] Fetching subscription overrides...');
    
    const { data: overrides, error: overridesError } = await supabaseClient
      .from('subscription_overrides')
      .select(`
        id,
        user_id,
        plan_slug,
        expires_at,
        reason,
        created_at,
        is_active
      `)
      .order('created_at', { ascending: false });

    if (overridesError) {
      console.error('[GET-SUBSCRIPTION-OVERRIDES] Error fetching overrides:', {
        error: overridesError,
        code: overridesError.code,
        message: overridesError.message,
        details: overridesError.details
      });
      return new Response(
        JSON.stringify({ error: 'Error fetching subscription overrides', details: overridesError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[GET-SUBSCRIPTION-OVERRIDES] Found ${overrides?.length || 0} overrides`);

    if (!overrides || overrides.length === 0) {
      console.log('[GET-SUBSCRIPTION-OVERRIDES] No overrides found, returning empty array');
      const duration = performance.now() - startTime;
      console.log(`[GET-SUBSCRIPTION-OVERRIDES] Function completed in ${duration.toFixed(2)}ms`);
      
      return new Response(
        JSON.stringify({ overrides: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get profile data separately to avoid relationship issues
    const userIds = [...new Set(overrides.map(o => o.user_id))]; // Remove duplicates
    console.log(`[GET-SUBSCRIPTION-OVERRIDES] Fetching profiles for ${userIds.length} unique users`);
    
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, full_name, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('[GET-SUBSCRIPTION-OVERRIDES] Error fetching profiles:', profilesError);
        // Continue without profile data if profiles fetch fails
      } else {
        profiles = profilesData || [];
        console.log(`[GET-SUBSCRIPTION-OVERRIDES] Successfully fetched ${profiles.length} profiles`);
      }
    }

    // Get email data from auth.users with timeout
    console.log('[GET-SUBSCRIPTION-OVERRIDES] Fetching auth users...');
    
    const authTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth request timeout')), 10000)
    );
    
    let authUsers: any;
    try {
      const authPromise = supabaseClient.auth.admin.listUsers();
      authUsers = await Promise.race([authPromise, authTimeoutPromise]);
      
      if (authUsers.error) {
        console.error('[GET-SUBSCRIPTION-OVERRIDES] Error fetching auth users:', authUsers.error);
        throw authUsers.error;
      }
      
      console.log(`[GET-SUBSCRIPTION-OVERRIDES] Successfully fetched ${authUsers.data?.users?.length || 0} auth users`);
    } catch (authError) {
      console.error('[GET-SUBSCRIPTION-OVERRIDES] Auth users fetch failed:', authError);
      // Continue without email data if auth fetch fails
      authUsers = { data: { users: [] } };
    }

    // Enrich overrides with profile and email data
    console.log('[GET-SUBSCRIPTION-OVERRIDES] Enriching override data...');
    
    const enrichedOverrides: SubscriptionOverride[] = overrides.map(override => {
      const authUser = authUsers.data?.users?.find((u: any) => u.id === override.user_id);
      const profile = profiles.find(p => p.id === override.user_id);
      
      return {
        ...override,
        profiles: {
          full_name: profile?.full_name || null,
          display_name: profile?.display_name || null
        },
        user_email: authUser?.email || 'N/A'
      };
    });

    const duration = performance.now() - startTime;
    console.log(`[GET-SUBSCRIPTION-OVERRIDES] Successfully enriched ${enrichedOverrides.length} overrides in ${duration.toFixed(2)}ms`);

    return new Response(
      JSON.stringify({ 
        overrides: enrichedOverrides,
        metadata: {
          total_count: enrichedOverrides.length,
          execution_time_ms: Math.round(duration)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('[GET-SUBSCRIPTION-OVERRIDES] Unexpected error:', {
      error: error.message,
      stack: error.stack,
      duration_ms: Math.round(duration)
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});