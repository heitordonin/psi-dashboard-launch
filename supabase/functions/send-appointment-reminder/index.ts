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

// Função utilitária para retry com backoff exponencial
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<{ success: boolean; result?: T; error?: any; attempts: number }> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, result, attempts: attempt };
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é um erro que vale a pena tentar novamente
      const isRetryableError = 
        // Erros 5xx do servidor
        (error.status >= 500 && error.status < 600) ||
        // Timeout
        error.name === 'TimeoutError' ||
        error.code === 'TIMEOUT' ||
        // Erros de rede
        error.name === 'NetworkError' ||
        error.message?.includes('timeout') ||
        error.message?.includes('network');
      
      if (!isRetryableError || attempt === maxRetries) {
        break;
      }
      
      // Backoff exponencial com jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`⏱️ Retry attempt ${attempt}/${maxRetries} after ${delay}ms for error:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: lastError, attempts: maxRetries };
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Appointment reminder function started');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

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
    
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error('❌ RESEND_API_KEY not found');
      throw new Error('RESEND_API_KEY not configured');
    }

    console.log('📧 Parsing request body...');
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }
    console.log('Request body received:', requestBody);

    const { appointmentId, reminderType }: AppointmentReminderRequest = requestBody;

    console.log('📋 Appointment reminder request:', { 
      appointmentId, 
      reminderType 
    });

    // Buscar informações do agendamento (sem embed para evitar ambiguidade)
    console.log('🔍 Fetching appointment information...');
    let appointment;
    let patientDetails = null;
    
    try {
      const { data, error } = await supabaseClient
        .from('appointments')
        .select('*')
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

      // Se há patient_id mas faltam dados de contato no appointment, buscar do paciente
      if (appointment.patient_id && (!appointment.patient_email || !appointment.patient_phone)) {
        console.log('🔍 Fetching additional patient details...');
        const { data: patientData, error: patientError } = await supabaseClient
          .from('patients')
          .select('full_name, email, phone')
          .eq('id', appointment.patient_id)
          .single();

        if (!patientError && patientData) {
          patientDetails = patientData;
          console.log('✅ Patient details retrieved:', patientDetails);
        } else {
          console.warn('⚠️ Could not fetch patient details:', patientError);
        }
      }

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

    // Buscar informações do perfil do usuário (terapeuta) e email
    let profile;
    let agendaSettings;
    let therapistEmail;
    
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

      // Buscar email do terapeuta através de uma consulta segura
      try {
        const { data: authUser, error: userError } = await supabaseClient.auth.admin.getUserById(appointment.user_id);
        
        if (userError) {
          console.warn('⚠️ Warning fetching therapist email:', userError);
        } else {
          therapistEmail = authUser.user?.email;
        }
      } catch (authError) {
        console.warn('⚠️ Could not fetch therapist email:', authError);
        therapistEmail = null;
      }

      // Buscar configurações de agenda para obter o timezone
      const { data: settingsData, error: settingsError } = await supabaseClient
        .from('agenda_settings')
        .select('timezone, therapist_whatsapp_notifications')
        .eq('user_id', appointment.user_id)
        .maybeSingle();

      if (settingsError) {
        console.warn('⚠️ Warning fetching agenda settings:', settingsError);
      }
      agendaSettings = settingsData;

      console.log('✅ Profile and settings retrieved:', { 
        profile: profile ? 'found' : 'not found',
        therapistEmail: therapistEmail ? 'found' : 'not found',
        agendaSettings: agendaSettings ? 'found' : 'using default'
      });

    } catch (fetchError: any) {
      console.warn('⚠️ Non-critical error fetching profile/settings:', fetchError);
      // Continue execution with defaults
      profile = null;
      therapistEmail = null;
      agendaSettings = null;
    }

    const therapistName = profile?.display_name || profile?.full_name || "Seu terapeuta";
    const patientName = appointment.patient_name || patientDetails?.full_name || "Paciente";
    const patientEmail = appointment.patient_email || patientDetails?.email;
    const patientPhone = appointment.patient_phone || patientDetails?.phone;
    const therapistPhone = profile?.phone;

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

    // Respeitar o tipo de lembrete solicitado
    let shouldSendEmail = false;
    let shouldSendWhatsApp = false;

    if (reminderType === 'immediate') {
      // Para lembretes imediatos, usar as configurações do agendamento
      shouldSendEmail = appointment.send_email_reminder;
      shouldSendWhatsApp = appointment.send_whatsapp_reminder;
    } else {
      // Para lembretes específicos por canal
      shouldSendEmail = (reminderType === 'email' || reminderType === 'both');
      shouldSendWhatsApp = (reminderType === 'whatsapp' || reminderType === 'both');
    }

    console.log('📋 Reminder settings:', { 
      reminderType, 
      shouldSendEmail, 
      shouldSendWhatsApp,
      patientEmail: patientEmail ? '✅' : '❌',
      patientPhone: patientPhone ? '✅' : '❌',
      therapistEmail: therapistEmail ? '✅' : '❌',
      therapistPhone: therapistPhone ? '✅' : '❌'
    });

    // Enviar email se solicitado e disponível
    if (shouldSendEmail) {
      console.log('📧 Sending email reminders to patient and therapist...');
      
      // Helper para enviar email
      const sendEmailReminder = async (recipientEmail: string, recipientType: 'patient' | 'therapist') => {
        if (!recipientEmail || !recipientEmail.includes('@')) {
          console.log(`⏭️ Skipping ${recipientType} email: invalid email`);
          return null;
        }

        // Verificar idempotência antes de enviar
        const { data: alreadySent } = await supabaseClient.rpc('is_reminder_already_sent', {
          p_appointment_id: appointmentId,
          p_reminder_type: `email_${recipientType}`
        });

        if (alreadySent) {
          console.log(`⏭️ Email reminder already sent to ${recipientType} for this time window, skipping...`);
          return {
            type: `email_${recipientType}`,
            success: true,
            recipient: recipientEmail,
            skipped: true,
            message: `Email já enviado para ${recipientType} nesta janela de tempo`
          };
        }
      
        const emailSubject = recipientType === 'patient' 
          ? `Lembrete: Consulta com ${therapistName}`
          : `Lembrete: Consulta com ${patientName}`;
          
        const greeting = recipientType === 'patient' 
          ? `Olá, ${patientName}!`
          : `Olá, ${therapistName}!`;
          
        const messageText = recipientType === 'patient'
          ? (reminderType === 'immediate' 
              ? 'Este é um lembrete sobre seu agendamento que acabou de ser criado:'
              : 'Este é um lembrete sobre sua consulta que se aproxima:')
          : (reminderType === 'immediate'
              ? 'Este é um lembrete sobre o agendamento que você acabou de criar:'
              : 'Este é um lembrete sobre sua consulta que se aproxima:');

        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Psiclo</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestão para Psicólogos</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0; font-size: 20px;">${greeting}</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                ${messageText}
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0; font-size: 18px;">📅 Detalhes da Consulta</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${recipientType === 'patient' ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold; width: 40%;">Terapeuta:</td>
                    <td style="padding: 8px 0; color: #333;">${therapistName}</td>
                  </tr>
                  ` : `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold; width: 40%;">Paciente:</td>
                    <td style="padding: 8px 0; color: #333;">${patientName}</td>
                  </tr>
                  `}
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
                  <strong>💡 Importante:</strong> ${recipientType === 'patient' 
                    ? 'Caso precise remarcar ou cancelar, entre em contato com antecedência.'
                    : 'Lembre-se de se preparar para a consulta com antecedência.'
                  }
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Este é um email automático do Psiclo. Não responda a este email.
              </p>
            </div>
          </div>
        `;

        try {
          const emailResult = await retryWithBackoff(async () => {
            return await resend.emails.send({
              from: "Agenda Psiclo <agenda@psiclo.com.br>",
              to: [recipientEmail],
              subject: emailSubject,
              html: emailContent,
            });
          });

          if (!emailResult.success) {
            throw emailResult.error;
          }

          const emailResponse = emailResult.result;
          console.log(`✅ Email sent successfully to ${recipientType} after ${emailResult.attempts} attempt(s):`, emailResponse);

          // Registrar entrega idempotente
          await supabaseClient.rpc('register_reminder_delivery', {
            p_appointment_id: appointmentId,
            p_reminder_type: `email_${recipientType}`,
            p_recipient_contact: recipientEmail,
            p_delivery_status: 'sent'
          });

          // Log no banco de dados
          try {
            await supabaseClient
              .from('appointment_reminders')
              .insert({
                appointment_id: appointmentId,
                reminder_type: `email_${recipientType}`,
                status: 'sent'
              });
          } catch (logError: any) {
            console.warn(`⚠️ Failed to log ${recipientType} email success:`, logError);
          }

          // Log do email para aparecer na interface de logs
          try {
            await supabaseClient
              .from('email_logs')
              .insert({
                owner_id: appointment.user_id,
                recipient_email: recipientEmail,
                email_type: 'appointment_reminder',
                subject: emailSubject,
                content: emailContent,
                status: 'sent',
                sent_at: new Date().toISOString()
              });
          } catch (logError: any) {
            console.warn(`⚠️ Failed to log ${recipientType} email in email_logs:`, logError);
          }

          return {
            type: `email_${recipientType}`,
            success: true,
            recipient: recipientEmail,
            messageId: emailResponse.data?.id
          };

        } catch (emailError) {
          // Registrar falha idempotente
          await supabaseClient.rpc('register_reminder_delivery', {
            p_appointment_id: appointmentId,
            p_reminder_type: `email_${recipientType}`,
            p_recipient_contact: recipientEmail,
            p_delivery_status: 'failed',
            p_error_message: emailError.message
          });

          console.error(`❌ Email sending to ${recipientType} failed:`, emailError);

          // Log erro no banco
          try {
            await supabaseClient
              .from('appointment_reminders')
              .insert({
                appointment_id: appointmentId,
                reminder_type: `email_${recipientType}`,
                status: 'failed',
                error_message: emailError.message
              });
          } catch (logError: any) {
            console.warn(`⚠️ Failed to log ${recipientType} email error:`, logError);
          }

          // Log do erro de email para aparecer na interface de logs
          try {
            await supabaseClient
              .from('email_logs')
              .insert({
                owner_id: appointment.user_id,
                recipient_email: recipientEmail,
                email_type: 'appointment_reminder',
                subject: emailSubject,
                content: emailContent,
                status: 'failed',
                error_message: emailError.message
              });
          } catch (logError: any) {
            console.warn(`⚠️ Failed to log ${recipientType} email error in email_logs:`, logError);
          }

          return {
            type: `email_${recipientType}`,
            success: false,
            recipient: recipientEmail,
            error: emailError.message
          };
        }
      };

      // Enviar para o paciente
      const patientEmailResult = await sendEmailReminder(patientEmail, 'patient');
      if (patientEmailResult) {
        results.push(patientEmailResult);
        if (patientEmailResult.success && !patientEmailResult.skipped) {
          emailSent = true;
        }
      }

      // Enviar para o terapeuta
      const therapistEmailResult = await sendEmailReminder(therapistEmail, 'therapist');
      if (therapistEmailResult) {
        results.push(therapistEmailResult);
      }
    }

    // Enviar WhatsApp se solicitado e disponível
    if (shouldSendWhatsApp) {
      console.log('📱 Sending WhatsApp reminders to patient and therapist...');
      
      // Helper para enviar WhatsApp
      const sendWhatsAppReminder = async (recipientPhone: string, recipientType: 'patient' | 'therapist') => {
        if (!recipientPhone) {
          console.log(`⏭️ Skipping ${recipientType} WhatsApp: no phone number`);
          return null;
        }

        // Verificar idempotência antes de enviar
        const { data: alreadySentWA } = await supabaseClient.rpc('is_reminder_already_sent', {
          p_appointment_id: appointmentId,
          p_reminder_type: `whatsapp_${recipientType}`
        });

        if (alreadySentWA) {
          console.log(`⏭️ WhatsApp reminder already sent to ${recipientType} for this time window, skipping...`);
          return {
            type: `whatsapp_${recipientType}`,
            success: true,
            recipient: recipientPhone,
            skipped: true,
            message: `WhatsApp já enviado para ${recipientType} nesta janela de tempo`
          };
        }
      
        try {
          // Usar template aprovado do Twilio para lembretes de agendamento
          const templateVariables = recipientType === 'patient' ? {
            "1": patientName,                    // Nome do paciente
            "2": formattedDate,                  // Data formatada
            "3": formattedTime,                  // Horário formatado
            "4": therapistName,                  // Nome do terapeuta
            "5": appointment.title,              // Título da consulta
            "6": appointment.notes || "Nenhuma observação" // Observações
          } : {
            "1": therapistName,                  // Nome do terapeuta
            "2": formattedDate,                  // Data formatada
            "3": formattedTime,                  // Horário formatado
            "4": patientName,                    // Nome do paciente
            "5": appointment.title,              // Título da consulta
            "6": appointment.notes || "Nenhuma observação" // Observações
          };

          console.log(`📋 Template variables for ${recipientType} WhatsApp:`, templateVariables);

          const whatsappResult = await retryWithBackoff(async () => {
            const { data, error } = await supabaseClient.functions.invoke('send-whatsapp', {
              body: {
                to: recipientPhone,
                templateSid: 'TWILIO_TEMPLATE_SID_APPOINTMENT_REMINDER',
                templateVariables: templateVariables,
                messageType: 'appointment_reminder',
                appointmentId: appointmentId,
                recipientType: recipientType,
                userId: appointment.user_id // Passar explicitamente o user_id
              }
            });
            
            if (error) throw error;
            return data;
          });

          if (!whatsappResult.success) {
            throw whatsappResult.error;
          }

          const whatsappResponse = whatsappResult.result;
          console.log(`✅ WhatsApp sent successfully to ${recipientType} after ${whatsappResult.attempts} attempt(s):`, whatsappResponse);

          // Registrar entrega idempotente
          await supabaseClient.rpc('register_reminder_delivery', {
            p_appointment_id: appointmentId,
            p_reminder_type: `whatsapp_${recipientType}`,
            p_recipient_contact: recipientPhone,
            p_delivery_status: 'sent'
          });

          // Log no banco de dados
          try {
            await supabaseClient
              .from('appointment_reminders')
              .insert({
                appointment_id: appointmentId,
                reminder_type: `whatsapp_${recipientType}`,
                status: 'sent'
              });
          } catch (logError: any) {
            console.warn(`⚠️ Failed to log ${recipientType} WhatsApp success:`, logError);
          }

          return {
            type: `whatsapp_${recipientType}`,
            success: true,
            recipient: recipientPhone,
            messageId: whatsappResponse?.messageId
          };

        } catch (whatsappError: any) {
          // Registrar falha idempotente
          await supabaseClient.rpc('register_reminder_delivery', {
            p_appointment_id: appointmentId,
            p_reminder_type: `whatsapp_${recipientType}`,
            p_recipient_contact: recipientPhone,
            p_delivery_status: 'failed',
            p_error_message: whatsappError.message
          });

          console.error(`❌ WhatsApp sending to ${recipientType} failed:`, whatsappError);

          // Log erro no banco
          try {
            await supabaseClient
              .from('appointment_reminders')
              .insert({
                appointment_id: appointmentId,
                reminder_type: `whatsapp_${recipientType}`,
                status: 'failed',
                error_message: whatsappError.message
              });
          } catch (logError: any) {
            console.warn(`⚠️ Failed to log ${recipientType} WhatsApp error:`, logError);
          }

          return {
            type: `whatsapp_${recipientType}`,
            success: false,
            recipient: recipientPhone,
            error: whatsappError.message
          };
        }
      };

      // Enviar para o paciente
      const patientWhatsAppResult = await sendWhatsAppReminder(patientPhone, 'patient');
      if (patientWhatsAppResult) {
        results.push(patientWhatsAppResult);
        if (patientWhatsAppResult.success && !patientWhatsAppResult.skipped) {
          whatsappSent = true;
        }
      }

      // Enviar para o terapeuta (verificar configuração first)
      let therapistWhatsAppResult = null;
      
      // Verificar se o terapeuta quer receber notificações no WhatsApp
      const shouldSendToTherapist = agendaSettings?.therapist_whatsapp_notifications !== false; // Default true se não configurado
      
      if (shouldSendToTherapist) {
        therapistWhatsAppResult = await sendWhatsAppReminder(therapistPhone, 'therapist');
      } else {
        console.log('⏭️ Skipping therapist WhatsApp: disabled in settings');
        therapistWhatsAppResult = {
          type: 'whatsapp_therapist',
          success: true,
          recipient: therapistPhone || 'N/A',
          skipped: true,
          message: 'Notificações desabilitadas nas configurações'
        };
      }
      
      if (therapistWhatsAppResult) {
        results.push(therapistWhatsAppResult);
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
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Log mais detalhado do erro
    if (error.code) console.error("Error code:", error.code);
    if (error.details) console.error("Error details:", error.details);
    if (error.hint) console.error("Error hint:", error.hint);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorCode: error.code || 'UNKNOWN_ERROR',
        errorName: error.name || 'Error',
        stack: error.stack,
        timestamp: new Date().toISOString(),
        function: 'send-appointment-reminder'
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