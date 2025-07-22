import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DocumentNotificationRequest {
  user_id: string;
  document_id: string;
  title: string;
  amount: number;
  due_date: string;
  competency: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, document_id, title, amount, due_date, competency }: DocumentNotificationRequest = await req.json();

    console.log("Sending document notification:", { user_id, document_id, title });

    // Get user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, display_name')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("Usuário não encontrado");
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin
      .getUserById(user_id);

    if (userError || !userData.user?.email) {
      console.error("Error fetching user email:", userError);
      throw new Error("Email do usuário não encontrado");
    }

    const userEmail = userData.user.email;
    const userName = profile?.full_name || profile?.display_name || "Usuário";

    // Format dates for display
    const dueDateFormatted = new Date(due_date).toLocaleDateString('pt-BR');
    const competencyFormatted = new Date(competency).toLocaleDateString('pt-BR');
    const amountFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Psiclo <noreply@psiclo.com.br>",
      to: [userEmail],
      subject: "Novo documento DARF disponível - Psiclo",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Psiclo</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestão para Psicólogos</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; font-size: 20px;">Olá, ${userName}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Um novo documento DARF foi disponibilizado para você no Psiclo.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px;">📄 Detalhes do Documento</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold; width: 40%;">Documento:</td>
                  <td style="padding: 8px 0; color: #333;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Valor:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; font-size: 18px;">${amountFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Competência:</td>
                  <td style="padding: 8px 0; color: #333;">${competencyFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Vencimento:</td>
                  <td style="padding: 8px 0; color: #e74c3c; font-weight: bold;">${dueDateFormatted}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://app.psiclo.com.br/documentos-recebidos"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                🔐 Acessar Psiclo
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>💡 Importante:</strong> Acesse sua conta no Psiclo para visualizar e gerenciar este documento.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Este é um email automático do Psiclo. Não responda a este email.<br>
              Se você não esperava receber este email, entre em contato com seu psicólogo.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Document notification email sent successfully:", emailResponse);

    // Log the email in the database
    await supabase
      .from('email_logs')
      .insert({
        owner_id: user_id,
        recipient_email: userEmail,
        email_type: 'document_notification',
        subject: 'Novo documento DARF disponível - Psiclo',
        content: `Documento: ${title} | Valor: ${amountFormatted} | Vencimento: ${dueDateFormatted}`,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notificação enviada com sucesso",
      email_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-document-notification function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro interno do servidor" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);