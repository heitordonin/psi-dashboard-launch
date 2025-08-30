
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get form data and token from request body
    const { formData, token } = await req.json()
    
    if (!token || !formData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token e dados do formulário são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing patient registration with token:', token.substring(0, 8) + '...')

    // Re-validate the token to ensure it's still valid
    const { data: invite, error: inviteError } = await supabase
      .from('patient_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      console.error('Token validation failed:', inviteError)
      return new Response(
        JSON.stringify({ success: false, error: 'Convite inválido ou expirado.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if token has expired
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt) {
      console.log('Token has expired:', expiresAt)
      return new Response(
        JSON.stringify({ success: false, error: 'Convite inválido ou expirado.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Token is valid, creating patient for owner:', invite.owner_id)

    // Get owner's email from auth.users to check if they're demo user
    const { data: ownerAuth, error: ownerError } = await supabase.auth.admin.getUserById(invite.owner_id)
    
    if (ownerError) {
      console.error('Error fetching owner auth data:', ownerError)
    }

    const isDemoOwner = ownerAuth?.user?.email === 'suporte@psiclo.com.br'

    // Skip validations for demo user's patients
    if (!isDemoOwner) {
      // Validate CPF format for individuals (only if not demo user)
      if (formData.patient_type === 'individual' && formData.cpf && !formData.is_payment_from_abroad) {
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
        if (!cpfRegex.test(formData.cpf)) {
          return new Response(
            JSON.stringify({ success: false, error: 'CPF deve estar no formato 000.000.000-00' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Validate CNPJ format for companies (only if not demo user)
      if (formData.patient_type === 'company' && formData.cnpj && !formData.is_payment_from_abroad) {
        const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
        if (!cnpjRegex.test(formData.cnpj)) {
          return new Response(
            JSON.stringify({ success: false, error: 'CNPJ deve estar no formato 00.000.000/0000-00' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Check for duplicate patients by CPF/CNPJ (only if not demo user)
      if (formData.patient_type === 'individual' && formData.cpf) {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('cpf', formData.cpf)
          .eq('owner_id', invite.owner_id)
          .single()

        if (existingPatient) {
          return new Response(
            JSON.stringify({ success: false, error: 'Já existe um paciente cadastrado com este CPF' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      if (formData.patient_type === 'company' && formData.cnpj) {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('cnpj', formData.cnpj)
          .eq('owner_id', invite.owner_id)
          .single()

        if (existingPatient) {
          return new Response(
            JSON.stringify({ success: false, error: 'Já existe um paciente cadastrado com este CNPJ' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Prepare patient data for insertion
    const patientData = {
      owner_id: invite.owner_id,
      full_name: formData.full_name,
      patient_type: formData.patient_type,
      cpf: formData.cpf || null,
      cnpj: formData.cnpj || null,
      email: formData.email || null,
      phone: formData.phone || null,
      has_financial_guardian: formData.has_financial_guardian,
      guardian_cpf: formData.guardian_cpf || null,
      is_payment_from_abroad: formData.is_payment_from_abroad,
      // Address fields
      zip_code: formData.zip_code || null,
      street: formData.street || null,
      street_number: formData.street_number || null,
      complement: formData.complement || null,
      neighborhood: formData.neighborhood || null,
      city: formData.city || null,
      state: formData.state || null,
    }

    // Create the patient record
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single()

    if (patientError) {
      console.error('Error creating patient:', patientError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar paciente. Tente novamente.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Patient created successfully:', patient.id)

    // Mark the invite as completed to prevent reuse
    const { error: updateError } = await supabase
      .from('patient_invites')
      .update({ status: 'completed' })
      .eq('id', invite.id)

    if (updateError) {
      console.error('Error updating invite status:', updateError)
      // Patient was created but invite status wasn't updated - log but don't fail
    }

    console.log('Patient registration completed successfully')

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cadastro realizado com sucesso!',
        patientId: patient.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in submit-patient-form:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
