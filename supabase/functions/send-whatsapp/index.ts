
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppRequest {
  to: string
  message?: string
  templateSid?: string
  templateVariables?: { [key: string]: string } // CORREÇÃO: objeto em vez de array
  paymentId?: string
  messageType?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get request data
    const { to, message, templateSid, templateVariables, paymentId, messageType = 'payment_reminder' }: WhatsAppRequest = await req.json()

    // Get Twilio credentials from Supabase secrets
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Missing Twilio credentials')
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resolve template SID from environment variables if it's a placeholder
    let resolvedTemplateSid = templateSid
    if (templateSid === 'TWILIO_TEMPLATE_SID_LEMBRETE') {
      resolvedTemplateSid = Deno.env.get('TWILIO_TEMPLATE_SID_LEMBRETE')
    } else if (templateSid === 'TWILIO_TEMPLATE_SID_OTP') {
      resolvedTemplateSid = Deno.env.get('TWILIO_TEMPLATE_SID_OTP_BUSINESS')
    }

    if (!resolvedTemplateSid && templateSid) {
      console.error('Template SID not found:', templateSid)
      return new Response(
        JSON.stringify({ error: 'Template SID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format phone number for WhatsApp (must include country code)
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+55${to.replace(/\D/g, '')}`
    const formattedFrom = twilioPhoneNumber.startsWith('whatsapp:') ? twilioPhoneNumber : `whatsapp:${twilioPhoneNumber}`

    console.log('Sending WhatsApp message:', { from: formattedFrom, to: formattedTo, templateSid: resolvedTemplateSid, templateVariables, message })

    // Send message via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('From', formattedFrom)
    formData.append('To', formattedTo)

    // Use template if provided, otherwise use plain text message
    if (resolvedTemplateSid && templateVariables) {
      formData.append('ContentSid', resolvedTemplateSid)
      formData.append('ContentVariables', JSON.stringify(templateVariables))
    } else if (message) {
      formData.append('Body', message)
    } else {
      throw new Error('Either templateSid with templateVariables or message must be provided')
    }

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    const twilioData = await twilioResponse.json()
    
    if (!twilioResponse.ok) {
      console.error('Twilio API error:', twilioData)
      throw new Error(twilioData.message || 'Failed to send WhatsApp message')
    }

    console.log('WhatsApp message sent successfully:', twilioData.sid)

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    let userId = null
    if (token) {
      const { data: { user } } = await supabaseClient.auth.getUser(token)
      userId = user?.id
    }

    // Log the message in the database
    if (userId) {
      const { error: logError } = await supabaseClient
        .from('whatsapp_logs')
        .insert({
          owner_id: userId,
          phone_number: to,
          message_content: message || `Template: ${resolvedTemplateSid}`,
          message_type: messageType,
          payment_id: paymentId,
          status: 'sent',
          evolution_message_id: twilioData.sid,
          sent_at: new Date().toISOString()
        })

      if (logError) {
        console.error('Error logging WhatsApp message:', logError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: twilioData.sid,
        status: twilioData.status 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
