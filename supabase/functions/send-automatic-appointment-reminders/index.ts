import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// CORS headers for web app requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentReminderData {
  appointment_id: string;
  user_id: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  title: string;
  start_datetime: string;
  therapist_name: string;
  timezone: string;
  reminder_type: 'email' | 'whatsapp';
  reminder_number: 1 | 2;
  minutes_before: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔄 Automatic appointment reminders started');
  console.log('Request method:', req.method);
  console.log('Timestamp:', new Date().toISOString());

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized');

    // Calculate time window for checking reminders (next 2 minutes to avoid missing any)
    const now = new Date();
    const windowEnd = new Date(now.getTime() + (2 * 60 * 1000)); // +2 minutes
    
    console.log('🕐 Checking reminders between:', {
      now: now.toISOString(),
      windowEnd: windowEnd.toISOString()
    });

    // Get all pending reminders that should be sent now
    const remindersToSend = await getPendingReminders(supabase, now, windowEnd);
    console.log(`📋 Found ${remindersToSend.length} reminders to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process each reminder
    for (const reminder of remindersToSend) {
      try {
        console.log(`📤 Processing reminder for appointment ${reminder.appointment_id} (${reminder.reminder_type})`);
        
        if (reminder.reminder_type === 'email' && reminder.patient_email) {
          await sendEmailReminder(supabase, reminder);
          await markReminderSent(supabase, reminder, 'email');
          successCount++;
          console.log(`✅ Email reminder sent for appointment ${reminder.appointment_id}`);
        } else if (reminder.reminder_type === 'whatsapp' && reminder.patient_phone) {
          await sendWhatsAppReminder(supabase, reminder);
          await markReminderSent(supabase, reminder, 'whatsapp');
          successCount++;
          console.log(`✅ WhatsApp reminder sent for appointment ${reminder.appointment_id}`);
        } else {
          console.log(`⚠️ Skipping reminder - missing contact info: ${reminder.reminder_type} for appointment ${reminder.appointment_id}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing reminder for appointment ${reminder.appointment_id}:`, error);
        
        // Log the failed reminder attempt
        await logFailedReminder(supabase, reminder, error.message);
      }
    }

    console.log(`🏁 Processing complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        message: 'Automatic reminders processed',
        processed: remindersToSend.length,
        success: successCount,
        errors: errorCount,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );

  } catch (error: any) {
    console.error("💥 Error in automatic reminders function:", error);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        function: 'send-automatic-appointment-reminders'
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );
  }
};

async function getPendingReminders(supabase: any, now: Date, windowEnd: Date): Promise<AppointmentReminderData[]> {
  console.log('🔍 Querying pending reminders...');
  
  // Query to find appointments that need reminders sent
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select(`
      id,
      user_id,
      patient_name,
      patient_email,
      patient_phone,
      title,
      start_datetime,
      email_reminder_sent_at,
      whatsapp_reminder_sent_at,
      send_email_reminder,
      send_whatsapp_reminder,
      profiles!inner(
        full_name,
        display_name
      )
    `)
    .eq('status', 'scheduled')
    .gte('start_datetime', now.toISOString())
    .lte('start_datetime', new Date(now.getTime() + (24 * 60 * 60 * 1000)).toISOString()); // Next 24 hours

  if (appointmentsError) {
    console.error('❌ Error fetching appointments:', appointmentsError);
    throw appointmentsError;
  }

  console.log(`📅 Found ${appointments?.length || 0} scheduled appointments in next 24 hours`);

  if (!appointments || appointments.length === 0) {
    return [];
  }

  // Get user IDs to fetch agenda settings
  const userIds = [...new Set(appointments.map(a => a.user_id))];
  
  const { data: agendaSettings, error: settingsError } = await supabase
    .from('agenda_settings')
    .select('*')
    .in('user_id', userIds);

  if (settingsError) {
    console.error('❌ Error fetching agenda settings:', settingsError);
    throw settingsError;
  }

  console.log(`⚙️ Found settings for ${agendaSettings?.length || 0} users`);

  const reminders: AppointmentReminderData[] = [];

  // Process each appointment
  for (const appointment of appointments) {
    const userSettings = agendaSettings?.find(s => s.user_id === appointment.user_id);
    if (!userSettings) {
      console.log(`⚠️ No settings found for user ${appointment.user_id}, skipping appointment ${appointment.id}`);
      continue;
    }

    const appointmentStart = new Date(appointment.start_datetime);
    const therapistName = appointment.profiles?.full_name || appointment.profiles?.display_name || 'Terapeuta';

    // Check email reminders
    if (appointment.send_email_reminder && appointment.patient_email) {
      // First email reminder
      if (userSettings.email_reminder_1_enabled && userSettings.email_reminder_1_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (userSettings.email_reminder_1_minutes * 60 * 1000));
        
        if (sendTime >= now && sendTime <= windowEnd) {
          // Check if this reminder was already sent
          if (!appointment.email_reminder_sent_at || new Date(appointment.email_reminder_sent_at) < sendTime) {
            reminders.push({
              appointment_id: appointment.id,
              user_id: appointment.user_id,
              patient_name: appointment.patient_name,
              patient_email: appointment.patient_email,
              patient_phone: appointment.patient_phone,
              title: appointment.title,
              start_datetime: appointment.start_datetime,
              therapist_name,
              timezone: userSettings.timezone || 'America/Sao_Paulo',
              reminder_type: 'email',
              reminder_number: 1,
              minutes_before: userSettings.email_reminder_1_minutes
            });
          }
        }
      }

      // Second email reminder
      if (userSettings.email_reminder_2_enabled && userSettings.email_reminder_2_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (userSettings.email_reminder_2_minutes * 60 * 1000));
        
        if (sendTime >= now && sendTime <= windowEnd) {
          reminders.push({
            appointment_id: appointment.id,
            user_id: appointment.user_id,
            patient_name: appointment.patient_name,
            patient_email: appointment.patient_email,
            patient_phone: appointment.patient_phone,
            title: appointment.title,
            start_datetime: appointment.start_datetime,
            therapist_name,
            timezone: userSettings.timezone || 'America/Sao_Paulo',
            reminder_type: 'email',
            reminder_number: 2,
            minutes_before: userSettings.email_reminder_2_minutes
          });
        }
      }
    }

    // Check WhatsApp reminders
    if (appointment.send_whatsapp_reminder && appointment.patient_phone) {
      // First WhatsApp reminder
      if (userSettings.whatsapp_reminder_1_enabled && userSettings.whatsapp_reminder_1_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (userSettings.whatsapp_reminder_1_minutes * 60 * 1000));
        
        if (sendTime >= now && sendTime <= windowEnd) {
          if (!appointment.whatsapp_reminder_sent_at || new Date(appointment.whatsapp_reminder_sent_at) < sendTime) {
            reminders.push({
              appointment_id: appointment.id,
              user_id: appointment.user_id,
              patient_name: appointment.patient_name,
              patient_email: appointment.patient_email,
              patient_phone: appointment.patient_phone,
              title: appointment.title,
              start_datetime: appointment.start_datetime,
              therapist_name,
              timezone: userSettings.timezone || 'America/Sao_Paulo',
              reminder_type: 'whatsapp',
              reminder_number: 1,
              minutes_before: userSettings.whatsapp_reminder_1_minutes
            });
          }
        }
      }

      // Second WhatsApp reminder
      if (userSettings.whatsapp_reminder_2_enabled && userSettings.whatsapp_reminder_2_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (userSettings.whatsapp_reminder_2_minutes * 60 * 1000));
        
        if (sendTime >= now && sendTime <= windowEnd) {
          reminders.push({
            appointment_id: appointment.id,
            user_id: appointment.user_id,
            patient_name: appointment.patient_name,
            patient_email: appointment.patient_email,
            patient_phone: appointment.patient_phone,
            title: appointment.title,
            start_datetime: appointment.start_datetime,
            therapist_name,
            timezone: userSettings.timezone || 'America/Sao_Paulo',
            reminder_type: 'whatsapp',
            reminder_number: 2,
            minutes_before: userSettings.whatsapp_reminder_2_minutes
          });
        }
      }
    }
  }

  console.log(`📬 Generated ${reminders.length} reminders to send`);
  return reminders;
}

async function sendEmailReminder(supabase: any, reminder: AppointmentReminderData) {
  console.log(`📧 Sending email reminder for appointment ${reminder.appointment_id}`);
  
  // Call the existing send-appointment-reminder function
  const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
    body: {
      appointmentId: reminder.appointment_id,
      reminderType: 'email'
    }
  });

  if (error) {
    console.error('❌ Error calling send-appointment-reminder for email:', error);
    throw error;
  }

  console.log('✅ Email reminder function response:', data);
}

async function sendWhatsAppReminder(supabase: any, reminder: AppointmentReminderData) {
  console.log(`📱 Sending WhatsApp reminder for appointment ${reminder.appointment_id}`);
  
  // Call the existing send-appointment-reminder function
  const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
    body: {
      appointmentId: reminder.appointment_id,
      reminderType: 'whatsapp'
    }
  });

  if (error) {
    console.error('❌ Error calling send-appointment-reminder for WhatsApp:', error);
    throw error;
  }

  console.log('✅ WhatsApp reminder function response:', data);
}

async function markReminderSent(supabase: any, reminder: AppointmentReminderData, type: 'email' | 'whatsapp') {
  console.log(`✅ Marking ${type} reminder as sent for appointment ${reminder.appointment_id}`);
  
  const updateField = type === 'email' ? 'email_reminder_sent_at' : 'whatsapp_reminder_sent_at';
  
  const { error } = await supabase
    .from('appointments')
    .update({ [updateField]: new Date().toISOString() })
    .eq('id', reminder.appointment_id);

  if (error) {
    console.error(`❌ Error marking ${type} reminder as sent:`, error);
    throw error;
  }
}

async function logFailedReminder(supabase: any, reminder: AppointmentReminderData, errorMessage: string) {
  console.log(`📝 Logging failed reminder for appointment ${reminder.appointment_id}`);
  
  try {
    const { error } = await supabase
      .from('appointment_reminders')
      .insert({
        appointment_id: reminder.appointment_id,
        reminder_type: reminder.reminder_type,
        status: 'failed',
        error_message: errorMessage,
        sent_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error logging failed reminder:', error);
    }
  } catch (logError) {
    console.error('❌ Failed to log error:', logError);
  }
}

serve(handler);