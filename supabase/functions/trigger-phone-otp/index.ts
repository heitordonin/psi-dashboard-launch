
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()

    if (!phone || !phone.startsWith('+')) {
      return new Response(
        JSON.stringify({ error: 'A valid phone number in E.164 format is required.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create a Supabase client with the user's authorization
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // This is the correct method to trigger a phone verification OTP for an existing user.
    // It associates the phone number with the user and automatically sends the code.
    const { data, error } = await supabaseClient.auth.updateUser({ phone: phone })

    if (error) {
      console.error('Error triggering phone verification (updateUser):', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent successfully!' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in trigger-phone-otp function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send verification code.',
        // Add the specific error details to the response
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
