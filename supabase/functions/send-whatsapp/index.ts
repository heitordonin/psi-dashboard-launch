
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Valid message types from the enum
type MessageType = 'text' | 'template' | 'payment_reminder' | 'appointment_reminder' | 'phone_verification' | 'invoice_receipt' | 'system_notification';

interface WhatsAppRequest {
  to: string
  message?: string
  templateSid?: string
  templateVariables?: { [key: string]: string }
  paymentId?: string
  messageType?: MessageType
  priority?: 'low' | 'normal' | 'high'
  retryCount?: number
}

// Performance metrics tracking
interface PerformanceMetrics {
  startTime: number
  twilioLatency?: number
  dbInsertLatency?: number
  totalLatency: number
  retryAttempts: number
  success: boolean
  errorType?: string
}

// Função utilitária para retry com backoff exponencial
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<{ success: boolean; result?: T; error?: any; attempts: number }> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, result, attempts: attempt };
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é um erro que vale a pena tentar novamente
      const isRetryableError = 
        // Erros 5xx do servidor
        (error.status >= 500 && error.status < 600) ||
        // Timeout
        error.name === 'TimeoutError' ||
        error.code === 'TIMEOUT' ||
        // Erros de rede
        error.name === 'NetworkError' ||
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ENOTFOUND');
      
      if (!isRetryableError || attempt === maxRetries) {
        break;
      }
      
      // Backoff exponencial com jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`⏱️ WhatsApp retry attempt ${attempt}/${maxRetries} after ${delay}ms for error:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: lastError, attempts: maxRetries };
}

// Função para validar e formatar números de telefone brasileiros
const formatBrazilianPhoneNumber = (phoneNumber: string): { formatted: string; isValid: boolean; error?: string } => {
  console.log('🔍 Formatando número original:', phoneNumber);
  
  // Remove todos os caracteres não numéricos
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  console.log('📱 Apenas dígitos extraídos:', digitsOnly);
  
  // Se já tem código do país (55), remove para validação
  let cleanNumber = digitsOnly;
  if (digitsOnly.startsWith('55') && digitsOnly.length >= 12) {
    cleanNumber = digitsOnly.substring(2);
    console.log('🌍 Removendo código do país 55:', cleanNumber);
  }
  
  // Validar se tem 10 ou 11 dígitos (formato brasileiro válido)
  if (cleanNumber.length < 10 || cleanNumber.length > 11) {
    const error = `Número inválido: deve ter 10 ou 11 dígitos, recebido ${cleanNumber.length} dígitos`;
    console.error('❌', error);
    return {
      formatted: `whatsapp:+55${cleanNumber}`,
      isValid: false,
      error
    };
  }
  
  // Validar código de área (primeiro 2 dígitos)
  const areaCode = cleanNumber.substring(0, 2);
  const validAreaCodes = ['11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
                         '21', '22', '24', // RJ  
                         '27', '28', // ES
                         '31', '32', '33', '34', '35', '37', '38', // MG
                         '41', '42', '43', '44', '45', '46', // PR
                         '47', '48', '49', // SC
                         '51', '53', '54', '55', // RS
                         '61', '62', '64', '65', '66', '67', '68', '69', // Centro-Oeste
                         '71', '73', '74', '75', '77', '79', // BA e SE
                         '81', '87', '82', '83', '84', '85', '86', '88', '89', // Nordeste
                         '91', '93', '94', '95', '96', '97', '98', '99']; // Norte
  
  if (!validAreaCodes.includes(areaCode)) {
    const error = `Código de área inválido: ${areaCode}`;
    console.warn('⚠️', error);
  }
  
  // Se tem 11 dígitos, verificar se o terceiro dígito é 9 (celular)
  if (cleanNumber.length === 11) {
    const thirdDigit = cleanNumber.charAt(2);
    if (thirdDigit !== '9') {
      const warning = `Número de 11 dígitos sem '9' no terceiro dígito: ${cleanNumber}`;
      console.warn('⚠️', warning);
    }
  }
  
  const formattedNumber = `whatsapp:+55${cleanNumber}`;
  console.log('✅ Número formatado com sucesso:', formattedNumber);
  
  return {
    formatted: formattedNumber,
    isValid: true
  };
};

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
      ...context
    }));
  };
  
  log('info', 'WhatsApp function started', { 
    method: req.method, 
    url: req.url,
    userAgent: req.headers.get('User-Agent')
  });
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('info', 'Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  const metrics: PerformanceMetrics = {
    startTime,
    totalLatency: 0,
    retryAttempts: 0,
    success: false
  };

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse and validate request data
    const { 
      to, 
      message, 
      templateSid, 
      templateVariables, 
      paymentId, 
      messageType = 'payment_reminder',
      priority = 'normal',
      retryCount = 3
    }: WhatsAppRequest = await req.json();

    // Validate messageType
    const validMessageTypes: MessageType[] = ['text', 'template', 'payment_reminder', 'appointment_reminder', 'phone_verification', 'invoice_receipt', 'system_notification'];
    if (!validMessageTypes.includes(messageType as MessageType)) {
      log('error', 'Invalid message type', { messageType, validTypes: validMessageTypes });
      return new Response(
        JSON.stringify({ error: `Invalid messageType. Must be one of: ${validMessageTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    log('info', 'Request parsed successfully', { 
      to: to.replace(/\d{4}$/, '****'), // Mask phone number for security
      hasMessage: !!message,
      templateSid, 
      hasTemplateVariables: !!templateVariables,
      paymentId, 
      messageType,
      priority
    });

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
      resolvedTemplateSid = Deno.env.get('TWILIO_TEMPLATE_SID_OTP')
    } else if (templateSid === 'TWILIO_TEMPLATE_SID_APPOINTMENT_REMINDER') {
      resolvedTemplateSid = Deno.env.get('TWILIO_TEMPLATE_SID_APPOINTMENT_REMINDER')
    }

    if (!resolvedTemplateSid && templateSid) {
      console.error('Template SID not found:', templateSid)
      console.log('⚠️ Template not configured, will try fallback message if available')
      
      // Se é lembrete de agendamento e template não está configurado, usar fallback
      if (templateSid === 'TWILIO_TEMPLATE_SID_APPOINTMENT_REMINDER' && !message) {
        console.log('🔄 Creating fallback message for appointment reminder')
        // Criar mensagem de fallback usando as variáveis do template
        const fallbackMessage = `🗓️ *Lembrete de Consulta*

Olá ${templateVariables?.["1"] || "Paciente"}!

Sua consulta se aproxima:

📅 *Data:* ${templateVariables?.["2"] || "Data não informada"}
🕐 *Horário:* ${templateVariables?.["3"] || "Horário não informado"}
👨‍⚕️ *Terapeuta:* ${templateVariables?.["4"] || "Terapeuta não informado"}
📝 *Título:* ${templateVariables?.["5"] || "Consulta"}

${templateVariables?.["6"] && templateVariables["6"] !== "Nenhuma observação" ? `📋 *Observações:* ${templateVariables["6"]}\n\n` : ''}💡 Caso precise remarcar ou cancelar, entre em contato com antecedência.

_Mensagem automática do Psiclo_`;
        
        // Usar a mensagem de fallback
        resolvedTemplateSid = null;
        templateVariables = null;
        message = fallbackMessage;
        console.log('✅ Fallback message created successfully');
      } else if (!message) {
        return new Response(
          JSON.stringify({ error: 'Template SID not configured and no fallback message provided' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Format phone number for WhatsApp (must include country code)
    console.log('🚀 Iniciando formatação de número para WhatsApp...');
    
    let formattedTo: string;
    if (to.startsWith('whatsapp:')) {
      formattedTo = to;
      console.log('📞 Número já formatado como WhatsApp:', formattedTo);
    } else {
      const phoneResult = formatBrazilianPhoneNumber(to);
      formattedTo = phoneResult.formatted;
      
      if (!phoneResult.isValid) {
        console.error('❌ Erro na validação do número:', phoneResult.error);
        return new Response(
          JSON.stringify({ error: `Número de telefone inválido: ${phoneResult.error}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const formattedFrom = twilioPhoneNumber.startsWith('whatsapp:') ? twilioPhoneNumber : `whatsapp:${twilioPhoneNumber}`;
    
    console.log('📤 Enviando mensagem WhatsApp:', {
      from: formattedFrom,
      to: formattedTo,
      templateSid: resolvedTemplateSid,
      hasTemplateVariables: !!templateVariables,
      templateVariables,
      hasMessage: !!message,
      messageType,
      paymentId
    });

    // Send message via Twilio API with retry logic and metrics
    const twilioStartTime = performance.now();
    const twilioResult = await retryWithBackoff(async () => {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
      
      const formData = new URLSearchParams()
      formData.append('From', formattedFrom)
      formData.append('To', formattedTo)

      // Use template if provided, otherwise use plain text message
      if (resolvedTemplateSid && templateVariables) {
        console.log('📤 Using Twilio template:', resolvedTemplateSid, 'with variables:', templateVariables);
        formData.append('ContentSid', resolvedTemplateSid)
        formData.append('ContentVariables', JSON.stringify(templateVariables))
      } else if (message) {
        console.log('📤 Using plain text message (fallback or direct)');
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
        const errorContext = {
          status: twilioResponse.status,
          statusText: twilioResponse.statusText,
          errorData: twilioData,
          requestId
        };
        log('error', 'Twilio API error', errorContext);
        
        // Criar um erro com status para que o retry possa detectar se é retryable
        const error = new Error(twilioData.message || `Falha ao enviar mensagem WhatsApp: ${twilioResponse.status} ${twilioResponse.statusText}`)
        error.status = twilioResponse.status
        throw error
      }
      
      return { twilioResponse, twilioData }
    }, retryCount);

    if (!twilioResult.success) {
      metrics.errorType = 'twilio_api_failure';
      metrics.retryAttempts = twilioResult.attempts;
      throw twilioResult.error;
    }

    const { twilioResponse, twilioData } = twilioResult.result;
    metrics.twilioLatency = performance.now() - twilioStartTime;
    metrics.retryAttempts = twilioResult.attempts;
    
    log('info', 'Twilio response received', {
      status: twilioResponse.status,
      messageId: twilioData.sid,
      messageStatus: twilioData.status,
      latencyMs: metrics.twilioLatency,
      retryAttempts: metrics.retryAttempts
    });

    log('info', 'WhatsApp message sent successfully', {
      messageId: twilioData.sid,
      status: twilioData.status,
      to: twilioData.to?.replace(/\d{4}$/, '****'), // Mask phone for security
      from: twilioData.from,
      attempts: twilioResult.attempts
    });

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    let userId = null
    if (token) {
      const { data: { user } } = await supabaseClient.auth.getUser(token)
      userId = user?.id
    }

    // If no userId from auth, try to get it from payment
    if (!userId && paymentId) {
      const { data: payment } = await supabaseClient
        .from('payments')
        .select('owner_id')
        .eq('id', paymentId)
        .single()
      
      userId = payment?.owner_id
    }

    // Always log the message in the database with performance tracking
    const dbStartTime = performance.now();
    if (userId) {
      try {
        // Extract only digits from phone number for database storage (constraint compliance)
        const phoneForDatabase = to.replace(/\D/g, '');
        // Ensure it has the Brazilian country code (55) for consistency
        const normalizedPhoneForDb = phoneForDatabase.startsWith('55') ? phoneForDatabase : `55${phoneForDatabase}`;
        
        const { error: logError } = await supabaseClient
          .from('whatsapp_logs')
          .insert({
            owner_id: userId,
            phone_number: normalizedPhoneForDb,
            message_content: message || `Template: ${resolvedTemplateSid}`,
            message_type: messageType as MessageType,
            payment_id: paymentId,
            status: 'sent',
            evolution_message_id: twilioData.sid,
            sent_at: new Date().toISOString()
          });

        metrics.dbInsertLatency = performance.now() - dbStartTime;

        if (logError) {
          log('error', 'Error logging WhatsApp message', { error: logError, userId, messageId: twilioData.sid });
          // Don't fail the request if logging fails, but track it
          metrics.errorType = 'db_log_failure';
        } else {
          log('info', 'Message logged successfully', { 
            userId, 
            messageId: twilioData.sid, 
            dbLatencyMs: metrics.dbInsertLatency 
          });
        }
      } catch (dbError) {
        metrics.dbInsertLatency = performance.now() - dbStartTime;
        metrics.errorType = 'db_log_exception';
        log('error', 'Exception logging WhatsApp message', { error: dbError, userId, messageId: twilioData.sid });
      }
    } else {
      log('warn', 'WhatsApp message sent but not logged - no user ID found', { 
        messageId: twilioData.sid,
        hasAuthHeader: !!req.headers.get('Authorization'),
        paymentId 
      });
    }

    metrics.success = true;
    metrics.totalLatency = performance.now() - startTime;

    // Log final metrics for observability
    log('info', 'Request completed successfully', {
      totalLatencyMs: metrics.totalLatency,
      twilioLatencyMs: metrics.twilioLatency,
      dbInsertLatencyMs: metrics.dbInsertLatency,
      retryAttempts: metrics.retryAttempts,
      messageType,
      priority
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: twilioData.sid,
        status: twilioData.status,
        requestId,
        metrics: {
          totalLatency: Math.round(metrics.totalLatency),
          retryAttempts: metrics.retryAttempts
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    metrics.totalLatency = performance.now() - startTime;
    metrics.success = false;
    
    // Determine error category
    if (!metrics.errorType) {
      if (error.message?.includes('phone')) {
        metrics.errorType = 'phone_validation_error';
      } else if (error.message?.includes('Twilio')) {
        metrics.errorType = 'twilio_error';
      } else if (error.message?.includes('auth')) {
        metrics.errorType = 'auth_error';
      } else {
        metrics.errorType = 'unknown_error';
      }
    }

    log('error', 'WhatsApp function failed', {
      error: error.message,
      stack: error.stack,
      errorType: metrics.errorType,
      totalLatencyMs: metrics.totalLatency,
      retryAttempts: metrics.retryAttempts
    });

    return new Response(
      JSON.stringify({ 
        error: error.message,
        requestId,
        errorType: metrics.errorType
      }),
      { 
        status: error.status || 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
