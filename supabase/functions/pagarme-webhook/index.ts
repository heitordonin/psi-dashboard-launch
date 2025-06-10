
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
    const body = await req.text()
    const webhookData = JSON.parse(body)
    
    console.log('Pagar.me webhook received:', {
      event: webhookData.event,
      transaction_id: webhookData.data?.id
    })

    // Verify webhook signature (recommended for production)
    // const signature = req.headers.get('x-hub-signature')
    // TODO: Implement signature verification using webhook secret

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle transaction.paid event
    if (webhookData.event === 'transaction.paid' || webhookData.event === 'pix.received') {
      const transactionId = webhookData.data?.id
      
      if (!transactionId) {
        console.error('No transaction ID in webhook data')
        return new Response('No transaction ID', { status: 400 })
      }

      // Find payment by transaction_id
      const { data: payment, error: findError } = await supabaseClient
        .from('payments')
        .select('id, status, owner_id')
        .eq('pagarme_transaction_id', transactionId)
        .single()

      if (findError || !payment) {
        console.error('Payment not found for transaction:', transactionId)
        return new Response('Payment not found', { status: 404 })
      }

      // Update payment status to paid
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0] // Today's date
        })
        .eq('id', payment.id)

      if (updateError) {
        console.error('Error updating payment status:', updateError)
        throw updateError
      }

      console.log(`Payment ${payment.id} marked as paid for transaction ${transactionId}`)

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Payment updated successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Handle other webhook events (transaction.failed, etc.)
    if (webhookData.event === 'transaction.failed') {
      const transactionId = webhookData.data?.id
      
      if (transactionId) {
        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({ status: 'failed' })
          .eq('pagarme_transaction_id', transactionId)

        if (updateError) {
          console.error('Error updating failed payment:', updateError)
        } else {
          console.log(`Payment marked as failed for transaction ${transactionId}`)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
