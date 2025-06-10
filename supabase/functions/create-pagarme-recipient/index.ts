
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

    const {
      legal_name,
      cpf,
      bank_code,
      agency_number,
      agency_digit,
      account_number,
      account_digit,
      account_type,
    } = await req.json()

    // Map PT field names to EN field names expected by Pagar.me
    const bank = bank_code
    const branch_number = agency_number
    const branch_check_digit = agency_digit || ""
    const account_check_digit = account_digit
    const type = account_type || "checking"

    // Basic validation of required fields
    if (
      !legal_name ||
      !cpf ||
      !bank ||
      !branch_number ||
      !account_number ||
      !account_check_digit ||
      !type
    ) {
      return new Response(
        JSON.stringify({ 
          message: "Missing required fields: legal_name, cpf, bank_code, agency_number, account_number, account_digit, account_type",
          success: false 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const pagarmeApiKey = Deno.env.get('PAGARME_API_KEY')
    if (!pagarmeApiKey) {
      throw new Error('PAGARME_API_KEY not configured')
    }

    // Build payload with correct Pagar.me v5 structure
    const recipientPayload = {
      name: legal_name,
      document: cpf.replace(/\D/g, ''), // Remove non-digits
      type: 'individual',
      default_bank_account: {
        holder_name: legal_name,
        holder_type: 'individual',
        holder_document: cpf.replace(/\D/g, ''),
        bank,
        branch_number,
        branch_check_digit,
        account_number,
        account_check_digit,
        type
      },
      payment_mode: 'bank_transfer'
    }

    console.log('📤 Pagar.me recipient payload', JSON.stringify(recipientPayload, null, 2))

    const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/recipients', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipientPayload)
    })

    if (!pagarmeResponse.ok) {
      const errorData = await pagarmeResponse.text()
      console.error('❌ Pagar.me error', pagarmeResponse.status, errorData)
      return new Response(errorData, { 
        status: pagarmeResponse.status,
        headers: corsHeaders 
      })
    }

    const recipient = await pagarmeResponse.json()
    console.log('✅ Pagar.me recipient created successfully:', recipient.id)

    // Update user profile with recipient_id
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ pagarme_recipient_id: recipient.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile with recipient_id:', updateError)
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
