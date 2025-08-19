
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Valid message statuses from Twilio
type TwilioMessageStatus = 'accepted' | 'queued' | 'sending' | 'sent' | 'receiving' | 'received' | 'delivered' | 'undelivered' | 'failed' | 'read';

interface WebhookMetrics {
  startTime: number
  processingTime?: number
  dbUpdateTime?: number
  totalTime: number
  success: boolean
  errorType?: string
}

serve(async (req) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  // Structured logging
  const log = (level: 'info' | 'warn' | 'error', message: string, context?: any) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      requestId,
      message,
      service: 'whatsapp-webhook',
      ...context
    }));
  };
  
  log('info', 'WhatsApp webhook received', { 
    method: req.method,
    userAgent: req.headers.get('User-Agent'),
    contentType: req.headers.get('Content-Type')
  });
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('info', 'Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  const metrics: WebhookMetrics = {
    startTime,
    totalTime: 0,
    success: false
  };

  try {
    const processingStartTime = performance.now();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get webhook data from Twilio
    const formData = await req.formData()
    const messageId = formData.get('MessageSid')?.toString()
    const messageStatus = formData.get('MessageStatus')?.toString() as TwilioMessageStatus
    const errorCode = formData.get('ErrorCode')?.toString()
    const errorMessage = formData.get('ErrorMessage')?.toString()
    const accountSid = formData.get('AccountSid')?.toString()
    const messagingServiceSid = formData.get('MessagingServiceSid')?.toString()
    const to = formData.get('To')?.toString()
    const from = formData.get('From')?.toString()

    metrics.processingTime = performance.now() - processingStartTime;

    log('info', 'Webhook data parsed', { 
      messageId, 
      messageStatus, 
      errorCode, 
      errorMessage,
      accountSid,
      to: to?.replace(/\d{4}$/, '****'), // Mask phone for security
      from
    });

    if (!messageId) {
      log('error', 'Missing MessageSid in webhook data');
      return new Response(
        JSON.stringify({ error: 'Missing MessageSid' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate message status
    const validStatuses: TwilioMessageStatus[] = ['accepted', 'queued', 'sending', 'sent', 'receiving', 'received', 'delivered', 'undelivered', 'failed', 'read'];
    if (messageStatus && !validStatuses.includes(messageStatus)) {
      log('warn', 'Invalid message status received', { messageStatus, messageId });
    }

    // Prepare update data with proper validation
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update status if it's provided and valid
    if (messageStatus) {
      updateData.status = messageStatus;
    }

    // Handle status-specific updates
    switch (messageStatus) {
      case 'delivered':
        updateData.delivered_at = new Date().toISOString();
        log('info', 'Message delivered', { messageId });
        break;
      case 'read':
        updateData.read_at = new Date().toISOString();
        log('info', 'Message read', { messageId });
        break;
      case 'failed':
      case 'undelivered':
        if (errorCode || errorMessage) {
          updateData.error_message = errorMessage || `Error code: ${errorCode}`;
        }
        log('warn', 'Message delivery failed', { messageId, errorCode, errorMessage });
        break;
      default:
        log('info', 'Message status updated', { messageId, messageStatus });
    }

    if (errorCode || errorMessage) {
      updateData.error_message = errorMessage || `Error code: ${errorCode}`;
    }

    // Update the log entry in database
    const dbUpdateStartTime = performance.now();
    const { error, count } = await supabaseClient
      .from('whatsapp_logs')
      .update(updateData)
      .eq('evolution_message_id', messageId)

    metrics.dbUpdateTime = performance.now() - dbUpdateStartTime;

    if (error) {
      log('error', 'Database update failed', { 
        error: error.message, 
        messageId, 
        updateData,
        dbLatencyMs: metrics.dbUpdateTime 
      });
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    metrics.success = true;
    metrics.totalTime = performance.now() - startTime;

    log('info', 'Webhook processed successfully', {
      messageId,
      messageStatus,
      updatedRecords: count || 0,
      processingTimeMs: metrics.processingTime,
      dbUpdateTimeMs: metrics.dbUpdateTime,
      totalTimeMs: metrics.totalTime
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId, 
        status: messageStatus,
        updatedRecords: count || 0,
        requestId 
      }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    metrics.totalTime = performance.now() - startTime;
    metrics.success = false;

    // Determine error category
    if (error.message?.includes('database') || error.message?.includes('supabase')) {
      metrics.errorType = 'database_error';
    } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      metrics.errorType = 'parsing_error';
    } else {
      metrics.errorType = 'unknown_error';
    }

    log('error', 'Webhook processing failed', {
      error: error.message,
      stack: error.stack,
      errorType: metrics.errorType,
      totalTimeMs: metrics.totalTime
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal error', 
        requestId,
        errorType: metrics.errorType 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
