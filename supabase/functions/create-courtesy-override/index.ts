import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOverrideRequest {
  user_id: string;
  plan_slug: string;
  expires_at?: string;
  reason: string;
}

Deno.serve(async (req) => {
  const startTime = performance.now();
  console.log('[CREATE-COURTESY-OVERRIDE] Function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CREATE-COURTESY-OVERRIDE] CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request method
  if (req.method !== 'POST') {
    console.error('[CREATE-COURTESY-OVERRIDE] Invalid method:', req.method);
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
      console.error('[CREATE-COURTESY-OVERRIDE] Missing environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[CREATE-COURTESY-OVERRIDE] Supabase client initialized');

    // Get and validate admin user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[CREATE-COURTESY-OVERRIDE] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[CREATE-COURTESY-OVERRIDE] Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[CREATE-COURTESY-OVERRIDE] Admin user authenticated: ${user.id}`);

    // Verify user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.error('[CREATE-COURTESY-OVERRIDE] User is not admin:', { userId: user.id, isAdmin: profile?.is_admin });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and validate request body
    let requestBody: CreateOverrideRequest;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('[CREATE-COURTESY-OVERRIDE] Invalid JSON in request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { user_id, plan_slug, expires_at, reason } = requestBody;
    
    // Validate required fields
    if (!user_id || !plan_slug || !reason) {
      console.error('[CREATE-COURTESY-OVERRIDE] Missing required fields:', { user_id: !!user_id, plan_slug: !!plan_slug, reason: !!reason });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, plan_slug, reason' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate plan_slug
    const validPlanSlugs = ['gestao', 'psi_regular'];
    if (!validPlanSlugs.includes(plan_slug)) {
      console.error('[CREATE-COURTESY-OVERRIDE] Invalid plan_slug:', plan_slug);
      return new Response(
        JSON.stringify({ error: `Invalid plan_slug. Must be one of: ${validPlanSlugs.join(', ')}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate expires_at if provided
    if (expires_at) {
      const expiryDate = new Date(expires_at);
      const now = new Date();
      
      // Must be a valid date
      if (isNaN(expiryDate.getTime())) {
        console.error('[CREATE-COURTESY-OVERRIDE] Invalid date format:', expires_at);
        return new Response(
          JSON.stringify({ error: 'expires_at must be a valid date in ISO format' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Must be in the future (at least 1 hour)
      const minFutureDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      if (expiryDate <= minFutureDate) {
        console.error('[CREATE-COURTESY-OVERRIDE] expires_at too close to current time:', expires_at);
        return new Response(
          JSON.stringify({ error: 'expires_at must be at least 1 hour in the future' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Cannot be more than 2 years in the future
      const maxFutureDate = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 years
      if (expiryDate > maxFutureDate) {
        console.error('[CREATE-COURTESY-OVERRIDE] expires_at too far in future:', expires_at);
        return new Response(
          JSON.stringify({ error: 'expires_at cannot be more than 2 years in the future' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validate reason length and content
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10 || trimmedReason.length > 500) {
      console.error('[CREATE-COURTESY-OVERRIDE] Invalid reason length:', trimmedReason.length);
      return new Response(
        JSON.stringify({ error: 'Reason must be between 10 and 500 characters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate reason content - must contain meaningful text
    if (!/[a-zA-ZÀ-ÿ]{3,}/.test(trimmedReason)) {
      console.error('[CREATE-COURTESY-OVERRIDE] Reason lacks meaningful content:', trimmedReason);
      return new Response(
        JSON.stringify({ error: 'Reason must contain meaningful descriptive text' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check for spam patterns (repeated characters)
    if (/(.)\1{4,}/.test(trimmedReason)) {
      console.error('[CREATE-COURTESY-OVERRIDE] Reason contains spam patterns:', trimmedReason);
      return new Response(
        JSON.stringify({ error: 'Reason cannot contain repetitive patterns' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user exists and get additional validation data
    const { data: targetUser, error: userCheckError } = await supabaseClient
      .from('profiles')
      .select('id, is_admin, created_at, full_name, email')
      .eq('id', user_id)
      .single();

    if (userCheckError || !targetUser) {
      console.error('[CREATE-COURTESY-OVERRIDE] Target user not found:', user_id);
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Business Rule: Cannot create courtesy plans for admin users
    if (targetUser.is_admin) {
      console.warn('[CREATE-COURTESY-OVERRIDE] Attempt to create override for admin user:', user_id);
      return new Response(
        JSON.stringify({ error: 'Cannot create courtesy plans for administrator users' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Business Rule: User must exist for at least 24 hours
    const userCreatedAt = new Date(targetUser.created_at);
    const minUserAge = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    if (userCreatedAt > minUserAge) {
      console.warn('[CREATE-COURTESY-OVERRIDE] User too new for courtesy plan:', { 
        userId: user_id, 
        createdAt: targetUser.created_at 
      });
      return new Response(
        JSON.stringify({ 
          error: 'User must exist for at least 24 hours before receiving courtesy plan',
          user_created_at: targetUser.created_at 
        }),
        { 
          status: 422, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check for existing active override
    const { data: existingOverride, error: existingCheckError } = await supabaseClient
      .from('subscription_overrides')
      .select('id, plan_slug, is_active')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingCheckError) {
      console.error('[CREATE-COURTESY-OVERRIDE] Error checking existing override:', existingCheckError);
      return new Response(
        JSON.stringify({ error: 'Error checking existing overrides' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (existingOverride) {
      console.warn('[CREATE-COURTESY-OVERRIDE] User already has active override:', { 
        userId: user_id, 
        existingPlan: existingOverride.plan_slug,
        newPlan: plan_slug 
      });
      return new Response(
        JSON.stringify({ 
          error: 'User already has an active courtesy plan',
          existing_plan: existingOverride.plan_slug,
          details: `Cannot create ${plan_slug} plan - user already has active ${existingOverride.plan_slug} courtesy plan`
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Business Rule: Check total active courtesy plans (admin monitoring)
    const { count: totalActiveOverrides, error: countError } = await supabaseClient
      .from('subscription_overrides')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) {
      console.error('[CREATE-COURTESY-OVERRIDE] Error counting active overrides:', countError);
    } else if (totalActiveOverrides !== null && totalActiveOverrides > 1000) {
      console.warn('[CREATE-COURTESY-OVERRIDE] High number of active courtesy plans:', totalActiveOverrides);
      // Log for admin monitoring but don't block creation
    }

    console.log(`[CREATE-COURTESY-OVERRIDE] Creating override for user ${user_id} with plan ${plan_slug}`);

    // Create the override
    const { data: newOverride, error: createError } = await supabaseClient
      .from('subscription_overrides')
      .insert([{
        user_id,
        plan_slug,
        expires_at: expires_at || null,
        reason: reason.trim(),
        created_by_admin_id: user.id,
        is_active: true
      }])
      .select()
      .single();

    if (createError) {
      console.error('[CREATE-COURTESY-OVERRIDE] Error creating override:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create courtesy override', details: createError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Trigger automatic subscription sync
    console.log(`[CREATE-COURTESY-OVERRIDE] Triggering subscription sync for user ${user_id}`);
    try {
      const { data: syncResult, error: syncError } = await supabaseClient.functions.invoke(
        'force-subscription-sync',
        {
          body: { 
            userId: user_id,
            triggerSource: 'courtesy_plan_creation',
            overrideId: newOverride.id
          }
        }
      );

      if (syncError) {
        console.warn('[CREATE-COURTESY-OVERRIDE] Subscription sync failed but override created:', syncError);
      } else {
        console.log('[CREATE-COURTESY-OVERRIDE] Subscription sync completed successfully:', syncResult);
      }
    } catch (syncError) {
      console.warn('[CREATE-COURTESY-OVERRIDE] Subscription sync failed but override created:', syncError);
    }

    const duration = performance.now() - startTime;
    console.log(`[CREATE-COURTESY-OVERRIDE] Successfully created override ${newOverride.id} in ${duration.toFixed(2)}ms`);

    return new Response(
      JSON.stringify({ 
        success: true,
        override: newOverride,
        message: `Courtesy plan ${plan_slug} created for user`,
        metadata: {
          execution_time_ms: Math.round(duration),
          created_by: user.id,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('[CREATE-COURTESY-OVERRIDE] Unexpected error:', {
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