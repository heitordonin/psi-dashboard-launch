import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AppointmentReminderRequest {
  appointmentId: string;
  reminderType: 'immediate' | 'scheduled';
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Appointment reminder function started');
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

    const { appointmentId, reminderType }: AppointmentReminderRequest = requestBody;

    console.log('📋 Appointment reminder request:', { 
      appointmentId, 
      reminderType 
    });

    // Buscar informações do agendamento
    console.log('🔍 Fetching appointment information...');
    let appointment;
    try {
      const { data, error } = await supabaseClient
        .from('appointments')
        .select(`
          *,
          patients (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Appointment not found');
      }

      appointment = data;
      console.log('✅ Appointment data retrieved:', appointment);

    } catch (appointmentError: any) {
      console.error('❌ Error fetching appointment:', appointmentError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch appointment", 
          details: appointmentError.message,
          appointmentId 
        }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Buscar informações do perfil do usuário (terapeuta)
    let profile;
    let agendaSettings;
    
    try {
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('display_name, full_name, phone')
        .eq('id', appointment.user_id)
        .maybeSingle();

      if (profileError) {
        console.warn('⚠️ Warning fetching profile:', profileError);
      }
      profile = profileData;

      // Buscar configurações de agenda para obter o timezone
      const { data: settingsData, error: settingsError } = await supabaseClient
        .from('agenda_settings')
        .select('timezone')
        .eq('user_id', appointment.user_id)
        .maybeSingle();

      if (settingsError) {
        console.warn('⚠️ Warning fetching agenda settings:', settingsError);
      }
      agendaSettings = settingsData;

      console.log('✅ Profile and settings retrieved:', { 
        profile: profile ? 'found' : 'not found',
        agendaSettings: agendaSettings ? 'found' : 'using default'
      });

    } catch (fetchError: any) {
      console.warn('⚠️ Non-critical error fetching profile/settings:', fetchError);
      // Continue execution with defaults
      profile = null;
      agendaSettings = null;
    }

    const therapistName = profile?.display_name || profile?.full_name || "Seu terapeuta";
    const patientName = appointment.patient_name || appointment.patients?.full_name || "Paciente";
    const patientEmail = appointment.patient_email || appointment.patients?.email;
    const patientPhone = appointment.patient_phone || appointment.patients?.phone;

    // Obter timezone do usuário (padrão: America/Sao_Paulo)
    const userTimezone = agendaSettings?.timezone || 'America/Sao_Paulo';

    // Formatação simples usando apenas JavaScript nativo
    let formattedDate: string;
    let formattedTime: string;
    let timeWithTimezone: string;
    
    try {
      const appointmentDate = new Date(appointment.start_datetime);
      
      // Validar se a data é válida
      if (isNaN(appointmentDate.getTime())) {
        throw new Error('Invalid appointment date');
      }
      
      // Formatação robusta e simples
      formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        timeZone: userTimezone
      });
      
      formattedTime = appointmentDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: userTimezone
      });
      
      timeWithTimezone = `${formattedTime} (${userTimezone})`;
      
      console.log('✅ Date formatting successful:', { 
        appointmentDate: appointmentDate.toISOString(),
        userTimezone,
        formattedDate, 
        formattedTime 
      });

    } catch (dateError: any) {
      console.error('❌ Date formatting error:', dateError);
      // Fallback simples
      const fallbackDate = new Date(appointment.start_datetime);
      formattedDate = fallbackDate.toDateString();
      formattedTime = fallbackDate.toTimeString().substring(0, 5);
      timeWithTimezone = `${formattedTime} (UTC)`;
      
      console.log('🔄 Using fallback formatting:', { formattedDate, formattedTime });
    }

    let emailSent = false;
    let whatsappSent = false;
    const results: any[] = [];

    // Enviar email se disponível
    if (patientEmail && patientEmail.includes('@')) {
      console.log('📧 Sending email reminder...');
      
      const emailSubject = `Lembrete: Consulta com ${therapistName}`;
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Psiclo</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestão para Psicólogos</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; font-size: 20px;">Olá, ${patientName}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              ${reminderType === 'immediate' 
                ? 'Este é um lembrete sobre seu agendamento que acabou de ser criado:'
                : 'Este é um lembrete sobre sua consulta que se aproxima:'
              }
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px;">📅 Detalhes da Consulta</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold; width: 40%;">Terapeuta:</td>
                  <td style="padding: 8px 0; color: #333;">${therapistName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Título:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${appointment.title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Data:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Horário:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${timeWithTimezone}</td>
                </tr>
                ${appointment.notes ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Observações:</td>
                  <td style="padding: 8px 0; color: #333;">${appointment.notes}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #0c5460; font-size: 14px;">
                <strong>💡 Importante:</strong> Caso precise remarcar ou cancelar, entre em contato com antecedência.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Este é um email automático do Psiclo. Não responda a este email.<br>
              Entre em contato com ${therapistName} para esclarecimentos sobre este agendamento.
            </p>
          </div>
        </div>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "Agenda Psiclo <agenda@psiclo.com.br>",
          to: [patientEmail],
          subject: emailSubject,
          html: emailContent,
        });

        console.log('✅ Email sent successfully:', emailResponse);
        emailSent = true;
        results.push({
          type: 'email',
          success: true,
          recipient: patientEmail,
          messageId: emailResponse.data?.id
        });

        // Log no banco de dados
        try {
          await supabaseClient
            .from('appointment_reminders')
            .insert({
              appointment_id: appointmentId,
              reminder_type: 'email',
              status: 'sent'
            });
        } catch (logError: any) {
          console.warn('⚠️ Failed to log email success:', logError);
        }

      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        results.push({
          type: 'email',
          success: false,
          recipient: patientEmail,
          error: emailError.message
        });

        // Log erro no banco
        try {
          await supabaseClient
            .from('appointment_reminders')
            .insert({
              appointment_id: appointmentId,
              reminder_type: 'email',
              status: 'failed',
              error_message: emailError.message
            });
        } catch (logError: any) {
          console.warn('⚠️ Failed to log email error:', logError);
        }
      }
    }

    // Enviar WhatsApp se disponível
    if (patientPhone) {
      console.log('📱 Sending WhatsApp reminder...');
      
      try {
        // Chamar a função send-whatsapp existente
        const whatsappMessage = `🗓️ *Lembrete de Consulta*

Olá ${patientName}!

${reminderType === 'immediate' 
  ? 'Sua consulta foi agendada com sucesso:'
  : 'Sua consulta se aproxima:'
}

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${timeWithTimezone}
👨‍⚕️ *Terapeuta:* ${therapistName}
📝 *Título:* ${appointment.title}

${appointment.notes ? `📋 *Observações:* ${appointment.notes}\n\n` : ''}💡 Caso precise remarcar ou cancelar, entre em contato com antecedência.

_Mensagem automática do Psiclo_`;

        const { data: whatsappResponse, error: whatsappError } = await supabaseClient.functions.invoke('send-whatsapp', {
          body: {
            to: patientPhone,
            message: whatsappMessage,
            messageType: 'appointment_reminder'
          }
        });

        if (whatsappError) {
          throw whatsappError;
        }

        console.log('✅ WhatsApp sent successfully:', whatsappResponse);
        whatsappSent = true;
        results.push({
          type: 'whatsapp',
          success: true,
          recipient: patientPhone,
          messageId: whatsappResponse?.messageId
        });

        // Log no banco de dados
        try {
          await supabaseClient
            .from('appointment_reminders')
            .insert({
              appointment_id: appointmentId,
              reminder_type: 'whatsapp',
              status: 'sent'
            });
        } catch (logError: any) {
          console.warn('⚠️ Failed to log WhatsApp success:', logError);
        }

      } catch (whatsappError: any) {
        console.error('❌ WhatsApp sending failed:', whatsappError);
        results.push({
          type: 'whatsapp',
          success: false,
          recipient: patientPhone,
          error: whatsappError.message
        });

        // Log erro no banco
        try {
          await supabaseClient
            .from('appointment_reminders')
            .insert({
              appointment_id: appointmentId,
              reminder_type: 'whatsapp',
              status: 'failed',
              error_message: whatsappError.message
            });
        } catch (logError: any) {
          console.warn('⚠️ Failed to log WhatsApp error:', logError);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalAttempts = results.length;

    console.log(`📊 Reminder summary: ${successCount}/${totalAttempts} sent successfully`);

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        message: `Lembretes enviados: ${successCount}/${totalAttempts}`,
        emailSent,
        whatsappSent,
        results,
        appointment: {
          id: appointmentId,
          title: appointment.title,
          patientName,
          date: formattedDate,
          time: timeWithTimezone
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("💥 Error in send-appointment-reminder function:", error);
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

console.log('🎯 Starting appointment reminder function server...');
serve(handler);