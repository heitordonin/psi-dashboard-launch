
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { full_name, cpf, bank_account } = await req.json()

    // Validate required fields
    if (!full_name || !cpf || !bank_account) {
      throw new Error('Missing required fields: full_name, cpf, bank_account')
    }

    const pagarmeApiKey = Deno.env.get('PAGARME_API_KEY')
    if (!pagarmeApiKey) {
      throw new Error('PAGARME_API_KEY not configured')
    }

    // Create recipient on Pagar.me
    const recipientData = {
      name: full_name,
      email: user.email,
      document: cpf.replace(/\D/g, ''), // Remove non-digits
      type: 'individual',
      bank_account: {
        bank_code: bank_account.bank_code,
        agencia: bank_account.agency,
        agencia_dv: bank_account.agency_digit || '',
        conta: bank_account.account,
        conta_dv: bank_account.account_digit,
        type: bank_account.type || 'conta_corrente',
        legal_name: full_name
      }
    }

    console.log('Creating Pagar.me recipient:', recipientData)

    const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/recipients', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipientData)
    })

    if (!pagarmeResponse.ok) {
      const errorData = await pagarmeResponse.text()
      console.error('Pagar.me API error:', errorData)
      throw new Error(`Pagar.me API error: ${pagarmeResponse.status} - ${errorData}`)
    }

    const recipient = await pagarmeResponse.json()
    console.log('Pagar.me recipient created:', recipient)

    // Update user profile with recipient_id
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ pagarme_recipient_id: recipient.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipient_id: recipient.id,
        status: recipient.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating recipient:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
