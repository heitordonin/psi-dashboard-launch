import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportTicketRequest {
  subject: string;
  category: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🎫 Support ticket function started');
  console.log('Request method:', req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Get the user from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No authorization header found');
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Verify the user token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('❌ Invalid or expired token:', authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Parse request body
    console.log('📋 Parsing request body...');
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);

    const { subject, category, message }: SupportTicketRequest = requestBody;

    // Validate required fields
    if (!subject || !category || !message) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ error: "Missing required fields: subject, category, message" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log('🎫 Support ticket details:', { 
      userEmail: user.email, 
      subject, 
      category 
    });

    // Get user profile information for additional context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || profile?.full_name || user.email;

    // Construct email subject and body
    const emailSubject = `[Psiclo Support] ${category}: ${subject}`;
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Novo Chamado de Suporte Aberto
        </h3>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Usuário:</strong> ${userName} (${user.email})</p>
          <p style="margin: 8px 0;"><strong>ID do Usuário:</strong> ${user.id}</p>
          <p style="margin: 8px 0;"><strong>Categoria:</strong> ${category}</p>
          <p style="margin: 8px 0;"><strong>Assunto:</strong> ${subject}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h4 style="color: #374151; margin-bottom: 10px;">Mensagem:</h4>
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; white-space: pre-wrap;">
${message}
          </div>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          Este email foi enviado automaticamente pelo sistema Psiclo - Suporte ao Cliente.<br>
          Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
        </p>
      </div>
    `;

    console.log('📧 Sending support ticket email via Resend...');
    
    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Suporte Psiclo <suporte@psiclo.com.br>",
      to: ["suporte@psiclo.com.br"],
      subject: emailSubject,
      html: emailContent,
    });

    console.log('✅ Resend response:', emailResponse);

    if (emailResponse.error) {
      console.error('❌ Resend error:', emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send support ticket",
          details: emailResponse.error
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('📧 Support ticket sent successfully to:', "suporte@psiclo.com.br");
    console.log('📄 Email ID:', emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Support ticket sent successfully",
        ticketId: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("💥 Error in send-support-ticket function:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

console.log('🎯 Starting support ticket function server...');
serve(handler);
