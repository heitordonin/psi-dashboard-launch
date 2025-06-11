
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

    const { payment_id, payment_method, card_data } = await req.json()

    // Get payment details
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        patients (
          full_name,
          cpf,
          email
        )
      `)
      .eq('id', payment_id)
      .eq('owner_id', user.id)
      .single()

    if (paymentError || !payment) {
      throw new Error('Payment not found')
    }

    // Get user profile with recipient_id
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('pagarme_recipient_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.pagarme_recipient_id) {
      throw new Error('User must create a Pagar.me recipient first')
    }

    const pagarmeApiKey = Deno.env.get('PAGARME_API_KEY')
    const pagarmeId = Deno.env.get('PAGARME_ID')
    
    if (!pagarmeApiKey || !pagarmeId) {
      throw new Error('Pagar.me credentials not configured')
    }

    // Calculate split amounts (90% to psychologist, 10% to platform)
    const totalAmount = Math.round(payment.amount * 100) // Convert to cents
    const psychologistAmount = Math.round(totalAmount * 0.9)
    const platformAmount = totalAmount - psychologistAmount

    // Build the charge object with split rules
    const chargeData = {
      amount: totalAmount,
      payment_method: payment_method,
      split_rules: [
        {
          recipient_id: profile.pagarme_recipient_id,
          amount: psychologistAmount,
          liable: true,
          charge_processing_fee: true
        },
        {
          recipient_id: pagarmeId, // Platform recipient ID
          amount: platformAmount,
          liable: false,
          charge_processing_fee: false
        }
      ]
    }

    // Add payment method specific data to charge
    if (payment_method === 'pix') {
      chargeData.pix = {
        expires_in: 3600 // 1 hour expiration
      }
    } else if (payment_method === 'credit_card' && card_data) {
      chargeData.card = {
        number: card_data.number,
        holder_name: card_data.holder_name,
        exp_month: card_data.exp_month,
        exp_year: card_data.exp_year,
        cvv: card_data.cvv
      }
    }

    // Build order data using Orders API structure
    const orderData = {
      customer: {
        name: payment.patients?.full_name || 'Cliente',
        email: payment.patients?.email || user.email,
        document: payment.patients?.cpf?.replace(/\D/g, '') || '',
        type: 'individual'
      },
      items: [
        {
          id: payment_id,
          title: payment.description || 'Consulta psicológica',
          unit_price: totalAmount,
          quantity: 1,
          tangible: false
        }
      ],
      charges: [chargeData]
    }

    console.log('Creating Pagar.me order:', {
      ...orderData,
      charges: orderData.charges.map(charge => ({
        ...charge,
        card: charge.card ? { ...charge.card, number: '****', cvv: '***' } : undefined
      }))
    })

    // Create order on Pagar.me using Orders API
    const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    if (!pagarmeResponse.ok) {
      const errorData = await pagarmeResponse.text()
      console.error('Pagar.me API error:', errorData)
      throw new Error(`Pagar.me API error: ${pagarmeResponse.status} - ${errorData}`)
    }

    const order = await pagarmeResponse.json()
    console.log('Pagar.me order created:', order)

    // Extract transaction details from the order response
    const charge = order.charges?.[0]
    const transaction = charge?.last_transaction

    if (!charge || !transaction) {
      throw new Error('Invalid order response from Pagar.me')
    }

    // Update payment with Pagar.me data
    const updateData: any = {
      pagarme_transaction_id: charge.id,
      status: 'pending'
    }

    // Extract payment details based on payment method
    if (payment_method === 'pix' && transaction.pix_qr_code) {
      updateData.pix_qr_code = transaction.pix_qr_code
    }

    if (transaction.url) {
      updateData.payment_url = transaction.url
    }

    const { error: updateError } = await supabaseClient
      .from('payments')
      .update(updateData)
      .eq('id', payment_id)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        transaction_id: charge.id,
        status: charge.status,
        pix_qr_code: transaction.pix_qr_code,
        payment_url: transaction.url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating order:', error)
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
