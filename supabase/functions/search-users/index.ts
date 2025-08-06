import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface User {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
}

Deno.serve(async (req) => {
  const startTime = performance.now();
  console.log('[SEARCH-USERS] Function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[SEARCH-USERS] CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request method
  if (req.method !== 'POST') {
    console.error('[SEARCH-USERS] Invalid method:', req.method);
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
      console.error('[SEARCH-USERS] Missing environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[SEARCH-USERS] Supabase client initialized');

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('[SEARCH-USERS] Invalid JSON in request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { searchTerm } = requestBody;
    
    if (!searchTerm || typeof searchTerm !== 'string') {
      console.error('[SEARCH-USERS] Missing or invalid searchTerm:', searchTerm);
      return new Response(
        JSON.stringify({ error: 'Missing or invalid searchTerm' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (searchTerm.length < 1) {
      console.log('[SEARCH-USERS] Search term too short:', searchTerm.length);
      return new Response(
        JSON.stringify({ 
          users: [],
          message: 'Search term must be at least 1 character long'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (searchTerm.length > 100) {
      console.error('[SEARCH-USERS] Search term too long:', searchTerm.length);
      return new Response(
        JSON.stringify({ error: 'Search term too long (max 100 characters)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const searchTermSafe = searchTerm.trim().toLowerCase();
    console.log(`[SEARCH-USERS] Searching for: "${searchTermSafe}"`);

    // Search profiles table with expanded search including CPF and better ordering
    const profileSearchPromise = supabaseClient
      .from('profiles')
      .select('id, full_name, display_name, cpf')
      .or(`full_name.ilike.%${searchTermSafe}%,display_name.ilike.%${searchTermSafe}%,cpf.ilike.%${searchTermSafe}%`)
      .order('full_name', { ascending: true })
      .limit(50); // Limit results to prevent excessive data

    const searchTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile search timeout')), 8000)
    );

    let profilesData;
    try {
      const profilesResult = await Promise.race([profileSearchPromise, searchTimeoutPromise]);
      profilesData = profilesResult.data || [];
      
      if (profilesResult.error) {
        console.error('[SEARCH-USERS] Profile search error:', profilesResult.error);
        throw profilesResult.error;
      }
      
      console.log(`[SEARCH-USERS] Found ${profilesData.length} profiles`);
    } catch (profileError) {
      console.error('[SEARCH-USERS] Profile search failed:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile search failed', details: profileError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (profilesData.length === 0) {
      console.log('[SEARCH-USERS] No profiles found');
      const duration = performance.now() - startTime;
      console.log(`[SEARCH-USERS] Function completed in ${duration.toFixed(2)}ms`);
      
      return new Response(
        JSON.stringify({ 
          users: [],
          message: 'No users found',
          metadata: {
            search_term: searchTermSafe,
            execution_time_ms: Math.round(duration)
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get authentication data with timeout
    console.log('[SEARCH-USERS] Fetching auth users...');
    
    const authTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth request timeout')), 10000)
    );

    let authUsers: any;
    try {
      const authPromise = supabaseClient.auth.admin.listUsers();
      authUsers = await Promise.race([authPromise, authTimeoutPromise]);
      
      if (authUsers.error) {
        console.error('[SEARCH-USERS] Auth users error:', authUsers.error);
        throw authUsers.error;
      }
      
      console.log(`[SEARCH-USERS] Retrieved ${authUsers.data?.users?.length || 0} auth users`);
    } catch (authError) {
      console.error('[SEARCH-USERS] Auth fetch failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user authentication data', details: authError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Combine profile and auth data
    console.log('[SEARCH-USERS] Combining profile and auth data...');
    
    const users: User[] = profilesData
      .map(profile => {
        const authUser = authUsers.data?.users?.find((u: any) => u.id === profile.id);
        if (!authUser?.email) {
          console.warn(`[SEARCH-USERS] No email found for user ${profile.id}`);
          return null;
        }
        
        return {
          id: profile.id,
          email: authUser.email,
          full_name: profile.full_name || '',
          display_name: profile.display_name || ''
        };
      })
      .filter(user => user !== null) as User[];

    const duration = performance.now() - startTime;
    console.log(`[SEARCH-USERS] Successfully found ${users.length} users in ${duration.toFixed(2)}ms`);

    return new Response(
      JSON.stringify({ 
        users,
        metadata: {
          search_term: searchTermSafe,
          total_count: users.length,
          execution_time_ms: Math.round(duration)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('[SEARCH-USERS] Unexpected error:', {
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