
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
    const { token, phone } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token é obrigatório' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

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

    console.log('Verificando OTP para telefone:', phone, 'token:', token)

    // Verificar o token OTP usando o sistema nativo do Supabase - CORREÇÃO CRÍTICA AQUI
    const { data: verifyData, error: verifyError } = await supabaseClient.auth.verifyOtp({
      token,
      type: 'sms', // Alterado de 'phone' para 'sms' - este é o tipo correto para OTPs de sign-in
      phone: phone
    })

    if (verifyError) {
      console.error('Erro na verificação OTP:', verifyError)
      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Criar cliente admin para atualizar o perfil
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Atualizar o perfil do usuário marcando o telefone como verificado
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ phone_verified: true })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Telefone verificado com sucesso!' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro na função verify-phone-otp:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
