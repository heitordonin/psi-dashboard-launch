
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Telefone é obrigatório' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

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
      console.error('Erro ao obter usuário:', userError)
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    console.log('Gerando OTP para usuário:', user.id, 'telefone:', phone)

    // Verificar rate limiting: máximo 5 códigos por hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabaseClient
      .from('phone_verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)

    if (count && count >= 5) {
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      )
    }

    // Invalidar códigos anteriores para este telefone
    await supabaseClient
      .from('phone_verification_codes')
      .update({ verified: true }) // Marca como usado para invalidar
      .eq('user_id', user.id)
      .eq('phone', phone)
      .eq('verified', false)

    // Gerar novo código OTP
    const code = generateOTP()
    console.log('Código gerado:', code)

    // Salvar no banco de dados
    const { error: insertError } = await supabaseClient
      .from('phone_verification_codes')
      .insert({
        user_id: user.id,
        phone: phone,
        code: code
      })

    if (insertError) {
      console.error('Erro ao salvar código no banco:', insertError)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Enviar via WhatsApp usando a função send-whatsapp
    const { error: whatsappError } = await supabaseClient.functions.invoke('send-whatsapp', {
      body: { 
        to: phone,
        templateSid: 'TWILIO_TEMPLATE_SID_OTP',
        templateVariables: {
          "1": code
        },
        messageType: 'phone_verification'
      }
    })

    if (whatsappError) {
      console.error('Erro ao enviar WhatsApp:', whatsappError)
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar código via WhatsApp' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('Código OTP enviado com sucesso via WhatsApp')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado com sucesso!',
        expiresIn: 300 // 5 minutos
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro na função generate-phone-otp:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
