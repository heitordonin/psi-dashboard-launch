
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header found')
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user from JWT token
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating invite for user:', user.id)

    // Generate secure random token (32 bytes = 64 hex characters)
    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)
    const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('')

    // Set expiration time to 2 hours from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 2)

    console.log('Generated token:', token.substring(0, 8) + '...') // Log first 8 chars for debugging
    console.log('Expires at:', expiresAt.toISOString())

    // Insert the invite into the database
    const { data: invite, error: insertError } = await supabase
      .from('patient_invites')
      .insert({
        owner_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating invite:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Invite created successfully:', invite.id)

    // Get the site URL for constructing the full invitation link
    const siteUrl = Deno.env.get('SITE_URL') || 'https://psiclo.lovable.app'
    const inviteUrl = `${siteUrl}/cadastro-paciente?token=${token}`

    console.log('Generated invite URL:', inviteUrl)

    // Return the complete invitation link
    return new Response(
      JSON.stringify({ 
        inviteUrl,
        token,
        expiresAt: expiresAt.toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in create-patient-invite:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
