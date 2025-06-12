
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting get-pagarme-balance function');

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }), 
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }), 
        { status: 401, headers: corsHeaders }
      );
    }

    console.log('User authenticated:', user.id);

    // Get user's pagarme_recipient_id from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('pagarme_recipient_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    if (!profile?.pagarme_recipient_id) {
      console.error('No pagarme_recipient_id found for user');
      return new Response(
        JSON.stringify({ error: 'Recipient ID not found. Please configure your payment account first.' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Found recipient ID:', profile.pagarme_recipient_id);

    // Get Pagar.me API key from environment
    const pagarmeApiKey = Deno.env.get('PAGARME_API_KEY');
    if (!pagarmeApiKey) {
      console.error('PAGARME_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Make request to Pagar.me API to get recipient balance
    const pagarmeUrl = `https://api.pagar.me/core/v5/recipients/${profile.pagarme_recipient_id}/balance`;
    
    console.log('Making request to Pagar.me API:', pagarmeUrl);

    const pagarmeResponse = await fetch(pagarmeUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!pagarmeResponse.ok) {
      const errorText = await pagarmeResponse.text();
      console.error('Pagar.me API error:', pagarmeResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch balance from payment service',
          details: `Status: ${pagarmeResponse.status}`
        }), 
        { status: 500, headers: corsHeaders }
      );
    }

    const balanceData = await pagarmeResponse.json();
    console.log('Successfully fetched balance data');

    return new Response(
      JSON.stringify({ 
        success: true,
        data: balanceData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-pagarme-balance:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
