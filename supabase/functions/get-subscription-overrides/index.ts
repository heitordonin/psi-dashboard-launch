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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching subscription overrides...');

    // Get subscription overrides with profile data
    // NOTE: We need to join with profiles table, not use the relationship syntax
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
      console.error('Error fetching overrides:', overridesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching subscription overrides' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!overrides || overrides.length === 0) {
      return new Response(
        JSON.stringify({ overrides: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get profile data separately to avoid relationship issues
    const userIds = overrides.map(o => o.user_id);
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, display_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue without profile data if profiles fetch fails
    }

    // Get email data from auth.users
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user emails' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Enrich overrides with profile and email data
    const enrichedOverrides: SubscriptionOverride[] = overrides.map(override => {
      const authUser = authUsers.users.find(u => u.id === override.user_id);
      const profile = profiles?.find(p => p.id === override.user_id);
      
      return {
        ...override,
        profiles: {
          full_name: profile?.full_name || null,
          display_name: profile?.display_name || null
        },
        user_email: authUser?.email || 'N/A'
      };
    });

    console.log(`Successfully fetched ${enrichedOverrides.length} overrides`);

    return new Response(
      JSON.stringify({ overrides: enrichedOverrides }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-subscription-overrides:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});