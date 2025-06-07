
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get webhook data from Twilio
    const formData = await req.formData()
    const messageId = formData.get('MessageSid')?.toString()
    const messageStatus = formData.get('MessageStatus')?.toString()
    const errorCode = formData.get('ErrorCode')?.toString()
    const errorMessage = formData.get('ErrorMessage')?.toString()

    console.log('WhatsApp webhook received:', { messageId, messageStatus, errorCode, errorMessage })

    if (!messageId) {
      return new Response('Missing MessageSid', { status: 400 })
    }

    // Update the log entry with the new status
    const updateData: any = {
      status: messageStatus,
      updated_at: new Date().toISOString()
    }

    if (messageStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    }

    if (messageStatus === 'read') {
      updateData.read_at = new Date().toISOString()
    }

    if (errorCode || errorMessage) {
      updateData.error_message = errorMessage || `Error code: ${errorCode}`
    }

    const { error } = await supabaseClient
      .from('whatsapp_logs')
      .update(updateData)
      .eq('evolution_message_id', messageId)

    if (error) {
      console.error('Error updating WhatsApp log:', error)
      return new Response('Database error', { status: 500 })
    }

    console.log('WhatsApp status updated successfully')

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Internal error', { status: 500 })
  }
})
