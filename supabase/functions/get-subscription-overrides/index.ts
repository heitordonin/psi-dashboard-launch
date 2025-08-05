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
    const { data: overrides, error: overridesError } = await supabaseClient
      .from('subscription_overrides')
      .select(`
        id,
        user_id,
        plan_slug,
        expires_at,
        reason,
        created_at,
        is_active,
        profiles:user_id (
          full_name,
          display_name
        )
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

    // Enrich overrides with email data
    const enrichedOverrides: SubscriptionOverride[] = overrides.map(override => {
      const authUser = authUsers.users.find(u => u.id === override.user_id);
      return {
        ...override,
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