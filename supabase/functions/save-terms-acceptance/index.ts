import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TermsAcceptanceRequest {
  email: string;
  userId?: string;
  formType: 'user_signup' | 'patient_signup' | 'post_checkout';
  termsUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      email, 
      userId, 
      formType, 
      termsUrl = 'https://psiclo.com.br/termos-de-uso' 
    }: TermsAcceptanceRequest = await req.json();

    // Validar campos obrigatórios
    if (!email || !formType) {
      return new Response(
        JSON.stringify({ error: 'Email and formType are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Capturar IP do cliente
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Capturar User Agent
    const userAgent = req.headers.get('user-agent') || 'unknown';

    console.log('Saving terms acceptance:', { 
      email, 
      userId, 
      formType, 
      ipAddress, 
      termsUrl 
    });

    // Inserir registro de aceite
    const { data, error } = await supabaseClient
      .from('user_terms_acceptance')
      .insert({
        user_id: userId || null,
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        terms_url: termsUrl,
        form_type: formType,
        accepted_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving terms acceptance:', error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Terms acceptance saved successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Terms acceptance saved successfully' 
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);