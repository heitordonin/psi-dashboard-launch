
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailReminderRequest {
  paymentId: string;
  recipientEmail: string;
  amount: number;
  patientName: string;
  dueDate: string;
  description?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Email reminder function started - v3.0 (with Resend)');
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

    console.log('📧 Parsing request body...');
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);

    const { 
      paymentId, 
      recipientEmail, 
      amount, 
      patientName, 
      dueDate, 
      description 
    }: EmailReminderRequest = requestBody;

    console.log('📋 Email reminder request:', { 
      paymentId, 
      recipientEmail, 
      patientName,
      amount,
      dueDate 
    });

    // Verificar se há email válido
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.error('❌ Invalid recipient email:', recipientEmail);
      return new Response(
        JSON.stringify({ error: "Invalid recipient email" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log('🔍 Fetching payment and user information...');
    // Buscar informações do pagamento usando explicit join
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        patients!inner(full_name, email)
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError) {
      console.error('❌ Error fetching payment:', paymentError);
      return new Response(
        JSON.stringify({ error: "Payment not found", details: paymentError }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log('✅ Payment data retrieved:', payment);

    // Buscar informações do perfil do usuário separadamente
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email_reminders_enabled, display_name, full_name')
      .eq('id', payment.owner_id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found", details: profileError }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log('✅ Profile data retrieved:', profile);

    // Verificar se o usuário tem lembretes habilitados (opcional por enquanto)
    console.log('📧 User email reminders enabled:', profile?.email_reminders_enabled);

    const therapistName = profile?.display_name || profile?.full_name || "Seu terapeuta";
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);

    const formattedDate = new Date(dueDate).toLocaleDateString('pt-BR');

    // Template do email em português
    const emailSubject = "Lembrete de Pagamento - Psiclo";
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Lembrete de Pagamento</h2>
        <p>Olá ${patientName},</p>
        <p>Este é um lembrete amigável sobre seu pagamento pendente:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Terapeuta:</strong> ${therapistName}</p>
          <p><strong>Valor:</strong> ${formattedAmount}</p>
          <p><strong>Vencimento:</strong> ${formattedDate}</p>
          ${description ? `<p><strong>Descrição:</strong> ${description}</p>` : ''}
        </div>
        
        <p>Se você já realizou o pagamento, pode ignorar esta mensagem.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Este email foi enviado automaticamente pelo sistema Psiclo.
        </p>
      </div>
    `;

    console.log('📧 Sending email via Resend...');
    
    // Enviar email usando Resend
    const emailResponse = await resend.emails.send({
      from: "Cobrança Psiclo <heitor@grupodeclara.com.br>", // Usando domínio padrão do Resend
      to: [recipientEmail],
      subject: emailSubject,
      html: emailContent,
    });

    console.log('✅ Resend response:', emailResponse);

    if (emailResponse.error) {
      console.error('❌ Resend error:', emailResponse.error);
      
      // Log do erro no banco
      await supabaseClient
        .from('email_logs')
        .insert({
          owner_id: payment.owner_id,
          payment_id: paymentId,
          recipient_email: recipientEmail,
          email_type: 'payment_reminder',
          subject: emailSubject,
          content: emailContent,
          status: 'failed',
          error_message: emailResponse.error.message || 'Unknown Resend error'
        });

      return new Response(
        JSON.stringify({ 
          error: "Failed to send email",
          details: emailResponse.error
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('💾 Logging successful email...');
    // Log do email bem-sucedido
    const { error: logError } = await supabaseClient
      .from('email_logs')
      .insert({
        owner_id: payment.owner_id,
        payment_id: paymentId,
        recipient_email: recipientEmail,
        email_type: 'payment_reminder',
        subject: emailSubject,
        content: emailContent,
        status: 'sent'
      });

    if (logError) {
      console.error('⚠️ Error logging email:', logError);
    } else {
      console.log('✅ Email logged successfully');
    }

    console.log('📧 Email sent successfully via Resend to:', recipientEmail);
    console.log('📄 Email ID:', emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email reminder sent successfully via Resend",
        recipient: recipientEmail,
        subject: emailSubject,
        emailId: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("💥 Error in send-email-reminder function:", error);
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

console.log('🎯 Starting email reminder function server (Resend)...');
serve(handler);
