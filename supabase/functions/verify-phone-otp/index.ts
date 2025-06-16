
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

    console.log('Verificando OTP para usuário:', user.id, 'telefone:', phone, 'token:', token)

    // Buscar o código de verificação válido
    const { data: verificationCode, error: fetchError } = await supabaseClient
      .from('phone_verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone', phone)
      .eq('code', token)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !verificationCode) {
      console.error('Código não encontrado ou inválido:', fetchError)
      
      // Incrementar tentativas se o código existir
      const { data: existingCode } = await supabaseClient
        .from('phone_verification_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('phone', phone)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingCode) {
        const newAttempts = existingCode.attempts + 1
        
        // Se exceder 3 tentativas, marcar como verificado (inválido)
        const updateData = newAttempts >= 3 
          ? { attempts: newAttempts, verified: true }
          : { attempts: newAttempts }

        await supabaseClient
          .from('phone_verification_codes')
          .update(updateData)
          .eq('id', existingCode.id)

        if (newAttempts >= 3) {
          return new Response(
            JSON.stringify({ error: 'Muitas tentativas incorretas. Solicite um novo código.' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          )
        }
      }

      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Marcar o código como verificado
    const { error: updateCodeError } = await supabaseClient
      .from('phone_verification_codes')
      .update({ verified: true })
      .eq('id', verificationCode.id)

    if (updateCodeError) {
      console.error('Erro ao marcar código como verificado:', updateCodeError)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Criar cliente admin para atualizar o perfil
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Atualizar o perfil do usuário marcando o telefone como verificado
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        phone_verified: true,
        phone: phone.replace(/^\+55/, ''), // Remove o +55 para salvar apenas o número
        phone_country_code: '+55'
      })
      .eq('id', user.id)

    if (updateProfileError) {
      console.error('Erro ao atualizar perfil:', updateProfileError)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('Telefone verificado com sucesso para usuário:', user.id)

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
