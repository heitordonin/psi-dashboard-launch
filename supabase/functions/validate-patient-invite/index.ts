
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

    // Get token from request body
    const { token } = await req.json()
    
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Validating token:', token.substring(0, 8) + '...') // Log first 8 chars for debugging

    // Query the patient_invites table
    const { data: invite, error: queryError } = await supabase
      .from('patient_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (queryError) {
      console.error('Error querying invite:', queryError)
      return new Response(
        JSON.stringify({ success: false, error: 'Convite inválido ou expirado.' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!invite) {
      console.log('No valid invite found for token')
      return new Response(
        JSON.stringify({ success: false, error: 'Convite inválido ou expirado.' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if token has expired
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt) {
      console.log('Token has expired:', expiresAt)
      return new Response(
        JSON.stringify({ success: false, error: 'Convite inválido ou expirado.' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Token validation successful for invite:', invite.id)

    // Return success
    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in validate-patient-invite:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
