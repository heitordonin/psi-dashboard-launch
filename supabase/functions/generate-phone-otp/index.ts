
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para gerar código OTP de 6 dígitos
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_ATTEMPTS_PER_HOUR: 5,
  WINDOW_HOURS: 1
};

// OTP Configuration  
const OTP_CONFIG = {
  EXPIRY_MINUTES: 5,
  CODE_LENGTH: 6
};

interface OTPMetrics {
  startTime: number
  rateLimitCheckTime?: number
  dbOperationTime?: number
  whatsappSendTime?: number
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
      service: 'generate-phone-otp',
      ...context
    }));
  };
  log('info', 'OTP generation request started', { 
    method: req.method,
    userAgent: req.headers.get('User-Agent')
  });

  if (req.method === 'OPTIONS') {
    log('info', 'Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  const metrics: OTPMetrics = {
    startTime,
    totalTime: 0,
    success: false
  };

  try {
    const { phone } = await req.json()

    if (!phone) {
      log('error', 'Phone number missing from request');
      return new Response(
        JSON.stringify({ error: 'Telefone é obrigatório' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      log('error', 'Invalid phone format', { phone: phone.replace(/\d{4}$/, '****') });
      return new Response(
        JSON.stringify({ error: 'Formato de telefone inválido' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    log('info', 'Phone validation passed', { 
      phone: phone.replace(/\d{4}$/, '****') // Mask phone for security
    });

    // Criar cliente Supabase com a autorização do usuário
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Obter o usuário autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      log('error', 'User authentication failed', { error: userError?.message });
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    log('info', 'User authenticated successfully', { userId: user.id });

    // Verificar rate limiting: máximo 5 códigos por hora
    const rateLimitStartTime = performance.now();
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT.WINDOW_HOURS * 60 * 60 * 1000).toISOString()
    const { count } = await supabaseClient
      .from('phone_verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)

    metrics.rateLimitCheckTime = performance.now() - rateLimitStartTime;

    log('info', 'Rate limit check completed', { 
      userId: user.id,
      attemptCount: count || 0,
      maxAttempts: RATE_LIMIT.MAX_ATTEMPTS_PER_HOUR,
      windowHours: RATE_LIMIT.WINDOW_HOURS,
      checkTimeMs: metrics.rateLimitCheckTime
    });

    if (count && count >= RATE_LIMIT.MAX_ATTEMPTS_PER_HOUR) {
      log('warn', 'Rate limit exceeded', { 
        userId: user.id, 
        attemptCount: count,
        phone: phone.replace(/\d{4}$/, '****')
      });
      return new Response(
        JSON.stringify({ 
          error: `Muitas tentativas. Tente novamente em ${RATE_LIMIT.WINDOW_HOURS} hora(s).`,
          retryAfter: RATE_LIMIT.WINDOW_HOURS * 3600 // seconds
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      )
    }

    // Database operations with performance tracking
    const dbOperationStartTime = performance.now();
    
    // Invalidar códigos anteriores para este telefone
    const { error: invalidateError } = await supabaseClient
      .from('phone_verification_codes')
      .update({ verified: true }) // Marca como usado para invalidar
      .eq('user_id', user.id)
      .eq('phone', phone)
      .eq('verified', false)

    if (invalidateError) {
      log('warn', 'Failed to invalidate previous codes', { 
        error: invalidateError.message, 
        userId: user.id 
      });
      // Continue anyway, not critical
    }

    // Gerar novo código OTP
    const code = generateOTP()
    log('info', 'OTP code generated successfully', { 
      userId: user.id,
      codeLength: code.length,
      expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES
    });

    // Salvar no banco de dados
    const { error: insertError } = await supabaseClient
      .from('phone_verification_codes')
      .insert({
        user_id: user.id,
        phone: phone,
        code: code
      })

    metrics.dbOperationTime = performance.now() - dbOperationStartTime;

    if (insertError) {
      log('error', 'Database insert failed', { 
        error: insertError.message, 
        userId: user.id,
        dbOperationTimeMs: metrics.dbOperationTime
      });
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    log('info', 'OTP code saved to database', { 
      userId: user.id,
      dbOperationTimeMs: metrics.dbOperationTime
    });

    // Enviar via WhatsApp usando a função send-whatsapp
    const whatsappStartTime = performance.now();
    const { error: whatsappError } = await supabaseClient.functions.invoke('send-whatsapp', {
      body: { 
        to: phone,
        templateSid: 'TWILIO_TEMPLATE_SID_OTP',
        templateVariables: {
          "1": code
        },
        messageType: 'phone_verification', // Using the enum value
        priority: 'high' // OTP is high priority
      }
    })

    metrics.whatsappSendTime = performance.now() - whatsappStartTime;

    if (whatsappError) {
      log('error', 'WhatsApp send failed', { 
        error: whatsappError.message, 
        userId: user.id,
        whatsappSendTimeMs: metrics.whatsappSendTime
      });
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao enviar código via WhatsApp',
          details: whatsappError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    metrics.success = true;
    metrics.totalTime = performance.now() - startTime;

    log('info', 'OTP sent successfully via WhatsApp', {
      userId: user.id,
      phone: phone.replace(/\d{4}$/, '****'),
      rateLimitCheckTimeMs: metrics.rateLimitCheckTime,
      dbOperationTimeMs: metrics.dbOperationTime,
      whatsappSendTimeMs: metrics.whatsappSendTime,
      totalTimeMs: metrics.totalTime
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado com sucesso!',
        expiresIn: OTP_CONFIG.EXPIRY_MINUTES * 60, // Convert to seconds
        requestId,
        metrics: {
          totalLatency: Math.round(metrics.totalTime),
          operations: {
            rateLimit: Math.round(metrics.rateLimitCheckTime || 0),
            database: Math.round(metrics.dbOperationTime || 0),
            whatsapp: Math.round(metrics.whatsappSendTime || 0)
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    metrics.totalTime = performance.now() - startTime;
    metrics.success = false;
    
    // Determine error category
    if (error.message?.includes('auth') || error.message?.includes('token')) {
      metrics.errorType = 'auth_error';
    } else if (error.message?.includes('database') || error.message?.includes('supabase')) {
      metrics.errorType = 'database_error';
    } else if (error.message?.includes('whatsapp') || error.message?.includes('twilio')) {
      metrics.errorType = 'whatsapp_error';
    } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      metrics.errorType = 'parsing_error';
    } else {
      metrics.errorType = 'unknown_error';
    }

    log('error', 'OTP generation failed', {
      error: error.message,
      stack: error.stack,
      errorType: metrics.errorType,
      totalTimeMs: metrics.totalTime
    });

    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        requestId,
        errorType: metrics.errorType
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
