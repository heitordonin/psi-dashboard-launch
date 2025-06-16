
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
    const { phone } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Número de telefone é obrigatório' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Validar formato E.164 (deve começar com +)
    if (!phone.startsWith('+')) {
      return new Response(
        JSON.stringify({ error: 'Número deve estar no formato E.164 (+55XXXXXXXXXXX)' }),
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

    console.log('Enviando OTP para:', phone)

    // Gerar e enviar o OTP. A opção shouldCreateUser:false é CRÍTICA.
    // Ela garante que NENHUM novo utilizador seja criado, prevenindo o bug da duplicação.
    const { data, error } = await supabaseClient.auth.signInWithOtp({
      phone: phone,
      options: {
        shouldCreateUser: false,
        channel: 'whatsapp'
      }
    });

    if (error) {
      console.error('Erro ao enviar OTP:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar código de verificação' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('OTP enviado com sucesso:', data)

    return new Response(
      JSON.stringify({ success: true, message: 'Código enviado com sucesso!' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro na função trigger-phone-otp:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
