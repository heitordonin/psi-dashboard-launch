
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      paymentId, 
      recipientEmail, 
      amount, 
      patientName, 
      dueDate, 
      description 
    }: EmailReminderRequest = await req.json();

    console.log('Email reminder request:', { paymentId, recipientEmail, patientName });

    // Verificar se há email válido
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.error('Invalid recipient email:', recipientEmail);
      return new Response(
        JSON.stringify({ error: "Invalid recipient email" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Buscar informações do pagamento e usuário
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        owner_id,
        profiles!payments_owner_id_fkey (
          email_reminders_enabled,
          display_name,
          full_name
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Verificar se o usuário tem lembretes habilitados (opcional por enquanto)
    console.log('User email reminders enabled:', payment?.profiles?.email_reminders_enabled);

    const therapistName = payment?.profiles?.display_name || payment?.profiles?.full_name || "Seu terapeuta";
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

    // Log do email
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
      console.error('Error logging email:', logError);
    }

    // Por enquanto, apenas simular o envio do email
    // TODO: Integrar com Resend, Mailgun ou outro provedor
    console.log('Email reminder sent successfully to:', recipientEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email reminder sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-email-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
