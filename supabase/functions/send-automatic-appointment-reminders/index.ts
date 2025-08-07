import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// CORS headers for web app requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const USER_RATE_LIMIT = 10; // reminders per hour per user
const GLOBAL_RATE_LIMIT = 100; // reminders per minute globally
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const USER_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

// Circuit breaker configuration
interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();
const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT = 300000; // 5 minutes

// Cache configuration
const settingsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes

// Batch configuration
const BATCH_SIZE = 10;
const MAX_CONCURRENT_BATCHES = 3;

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
  console.log('🔄 Optimized automatic appointment reminders started');
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

    // Check global rate limit
    if (!checkGlobalRateLimit()) {
      console.warn('⚠️ Global rate limit exceeded, skipping this execution');
      return new Response(
        JSON.stringify({ 
          message: 'Global rate limit exceeded',
          timestamp: new Date().toISOString()
        }),
        {
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          },
        }
      );
    }

    // Calculate time window for checking reminders (next 7 minutes for 5-minute cron)
    const now = new Date();
    const windowEnd = new Date(now.getTime() + (7 * 60 * 1000)); // +7 minutes
    
    console.log('🕐 Checking reminders between:', {
      now: now.toISOString(),
      windowEnd: windowEnd.toISOString()
    });

    // Get all pending reminders using optimized query
    const remindersToSend = await getPendingRemindersOptimized(supabase, now, windowEnd);
    console.log(`📋 Found ${remindersToSend.length} reminders to process`);

    if (remindersToSend.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No reminders to process',
          processed: 0,
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
    }

    // Process reminders in batches with rate limiting
    const results = await processBatchedReminders(supabase, remindersToSend);

    console.log(`🏁 Processing complete. Success: ${results.successCount}, Errors: ${results.errorCount}, Rate Limited: ${results.rateLimitedCount}`);

    return new Response(
      JSON.stringify({ 
        message: 'Automatic reminders processed',
        processed: remindersToSend.length,
        success: results.successCount,
        errors: results.errorCount,
        rateLimited: results.rateLimitedCount,
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

// Rate limiting functions
function checkGlobalRateLimit(): boolean {
  const now = Date.now();
  const key = 'global';
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= GLOBAL_RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const key = `user:${userId}`;
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + USER_RATE_WINDOW });
    return true;
  }
  
  if (record.count >= USER_RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Circuit breaker functions
function getCircuitBreakerState(service: string): CircuitBreakerState {
  const state = circuitBreakers.get(service);
  if (!state) {
    const newState: CircuitBreakerState = {
      failureCount: 0,
      lastFailureTime: 0,
      state: 'closed'
    };
    circuitBreakers.set(service, newState);
    return newState;
  }
  return state;
}

function canExecute(service: string): boolean {
  const state = getCircuitBreakerState(service);
  const now = Date.now();
  
  switch (state.state) {
    case 'closed':
      return true;
    case 'open':
      if (now - state.lastFailureTime > RECOVERY_TIMEOUT) {
        state.state = 'half-open';
        return true;
      }
      return false;
    case 'half-open':
      return true;
    default:
      return true;
  }
}

function onSuccess(service: string): void {
  const state = getCircuitBreakerState(service);
  state.failureCount = 0;
  state.state = 'closed';
}

function onFailure(service: string): void {
  const state = getCircuitBreakerState(service);
  state.failureCount++;
  state.lastFailureTime = Date.now();
  
  if (state.failureCount >= FAILURE_THRESHOLD) {
    state.state = 'open';
  }
}

// Cache functions
function getCachedSettings(userId: string): any | null {
  const cached = settingsCache.get(userId);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    settingsCache.delete(userId);
    return null;
  }
  
  return cached.data;
}

function setCachedSettings(userId: string, data: any): void {
  settingsCache.set(userId, {
    data,
    timestamp: Date.now()
  });
}

// Optimized query with single JOIN
async function getPendingRemindersOptimized(supabase: any, now: Date, windowEnd: Date): Promise<AppointmentReminderData[]> {
  console.log('🔍 Querying pending reminders with optimized query...');
  
  // Single optimized query with JOIN
  const { data: appointmentsWithSettings, error } = await supabase
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
      ),
      agenda_settings!inner(
        timezone,
        email_reminder_1_enabled,
        email_reminder_1_minutes,
        email_reminder_2_enabled,
        email_reminder_2_minutes,
        whatsapp_reminder_1_enabled,
        whatsapp_reminder_1_minutes,
        whatsapp_reminder_2_enabled,
        whatsapp_reminder_2_minutes
      )
    `)
    .eq('status', 'scheduled')
    .gte('start_datetime', now.toISOString())
    .lte('start_datetime', new Date(now.getTime() + (24 * 60 * 60 * 1000)).toISOString())
    .limit(500); // Pagination limit

  if (error) {
    console.error('❌ Error fetching appointments with settings:', error);
    throw error;
  }

  console.log(`📅 Found ${appointmentsWithSettings?.length || 0} scheduled appointments with settings`);

  if (!appointmentsWithSettings || appointmentsWithSettings.length === 0) {
    return [];
  }

  const reminders: AppointmentReminderData[] = [];

  // Process appointments and generate reminders
  for (const appointment of appointmentsWithSettings) {
    const settings = appointment.agenda_settings;
    const appointmentStart = new Date(appointment.start_datetime);
    const therapistName = appointment.profiles?.full_name || appointment.profiles?.display_name || 'Terapeuta';

    // Check email reminders
    if (appointment.send_email_reminder && appointment.patient_email) {
      // First email reminder
      if (settings.email_reminder_1_enabled && settings.email_reminder_1_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (settings.email_reminder_1_minutes * 60 * 1000));
        
        if (sendTime >= now && sendTime <= windowEnd && 
            (!appointment.email_reminder_sent_at || new Date(appointment.email_reminder_sent_at) < sendTime)) {
          reminders.push({
            appointment_id: appointment.id,
            user_id: appointment.user_id,
            patient_name: appointment.patient_name,
            patient_email: appointment.patient_email,
            patient_phone: appointment.patient_phone,
            title: appointment.title,
            start_datetime: appointment.start_datetime,
            therapist_name,
            timezone: settings.timezone || 'America/Sao_Paulo',
            reminder_type: 'email',
            reminder_number: 1,
            minutes_before: settings.email_reminder_1_minutes
          });
        }
      }

      // Second email reminder
      if (settings.email_reminder_2_enabled && settings.email_reminder_2_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (settings.email_reminder_2_minutes * 60 * 1000));
        
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
            timezone: settings.timezone || 'America/Sao_Paulo',
            reminder_type: 'email',
            reminder_number: 2,
            minutes_before: settings.email_reminder_2_minutes
          });
        }
      }
    }

    // Check WhatsApp reminders
    if (appointment.send_whatsapp_reminder && appointment.patient_phone) {
      // First WhatsApp reminder
      if (settings.whatsapp_reminder_1_enabled && settings.whatsapp_reminder_1_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (settings.whatsapp_reminder_1_minutes * 60 * 1000));
        
        if (sendTime >= now && sendTime <= windowEnd && 
            (!appointment.whatsapp_reminder_sent_at || new Date(appointment.whatsapp_reminder_sent_at) < sendTime)) {
          reminders.push({
            appointment_id: appointment.id,
            user_id: appointment.user_id,
            patient_name: appointment.patient_name,
            patient_email: appointment.patient_email,
            patient_phone: appointment.patient_phone,
            title: appointment.title,
            start_datetime: appointment.start_datetime,
            therapist_name,
            timezone: settings.timezone || 'America/Sao_Paulo',
            reminder_type: 'whatsapp',
            reminder_number: 1,
            minutes_before: settings.whatsapp_reminder_1_minutes
          });
        }
      }

      // Second WhatsApp reminder
      if (settings.whatsapp_reminder_2_enabled && settings.whatsapp_reminder_2_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (settings.whatsapp_reminder_2_minutes * 60 * 1000));
        
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
            timezone: settings.timezone || 'America/Sao_Paulo',
            reminder_type: 'whatsapp',
            reminder_number: 2,
            minutes_before: settings.whatsapp_reminder_2_minutes
          });
        }
      }
    }
  }

  console.log(`📬 Generated ${reminders.length} reminders to send`);
  return reminders;
}

// Batch processing with rate limiting and retry logic
async function processBatchedReminders(supabase: any, reminders: AppointmentReminderData[]): Promise<{
  successCount: number;
  errorCount: number;
  rateLimitedCount: number;
}> {
  console.log('🔄 Processing reminders in batches...');
  
  let successCount = 0;
  let errorCount = 0;
  let rateLimitedCount = 0;

  // Create batches
  const batches = [];
  for (let i = 0; i < reminders.length; i += BATCH_SIZE) {
    batches.push(reminders.slice(i, i + BATCH_SIZE));
  }

  // Process batches with concurrency control
  const semaphore = new Array(MAX_CONCURRENT_BATCHES).fill(null);
  const batchPromises = batches.map(async (batch, batchIndex) => {
    // Wait for available slot
    await Promise.race(semaphore.map(async (_, slotIndex) => {
      while (semaphore[slotIndex] !== null) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      semaphore[slotIndex] = batchIndex;
    }));

    try {
      console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} reminders`);
      
      const batchResults = await Promise.allSettled(
        batch.map(reminder => processReminderWithRetry(supabase, reminder))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successCount++;
          } else if (result.value.rateLimited) {
            rateLimitedCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      }
    } finally {
      // Release slot
      const slotIndex = semaphore.indexOf(batchIndex);
      if (slotIndex !== -1) {
        semaphore[slotIndex] = null;
      }
    }
  });

  await Promise.all(batchPromises);

  return { successCount, errorCount, rateLimitedCount };
}

// Retry logic with exponential backoff
async function processReminderWithRetry(supabase: any, reminder: AppointmentReminderData, maxRetries = 3): Promise<{
  success: boolean;
  rateLimited: boolean;
  error?: string;
}> {
  // Check user rate limit
  if (!checkUserRateLimit(reminder.user_id)) {
    console.warn(`⚠️ Rate limit exceeded for user ${reminder.user_id}`);
    return { success: false, rateLimited: true };
  }

  const service = reminder.reminder_type === 'email' ? 'email-service' : 'whatsapp-service';
  
  // Check circuit breaker
  if (!canExecute(service)) {
    console.warn(`⚠️ Circuit breaker open for ${service}`);
    return { success: false, rateLimited: false, error: 'Circuit breaker open' };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Processing reminder attempt ${attempt}/${maxRetries} for appointment ${reminder.appointment_id} (${reminder.reminder_type})`);
      
      if (reminder.reminder_type === 'email' && reminder.patient_email) {
        await sendEmailReminderOptimized(supabase, reminder);
        await markReminderSent(supabase, reminder, 'email');
      } else if (reminder.reminder_type === 'whatsapp' && reminder.patient_phone) {
        await sendWhatsAppReminderOptimized(supabase, reminder);
        await markReminderSent(supabase, reminder, 'whatsapp');
      } else {
        console.log(`⚠️ Skipping reminder - missing contact info: ${reminder.reminder_type} for appointment ${reminder.appointment_id}`);
        return { success: false, rateLimited: false, error: 'Missing contact info' };
      }

      onSuccess(service);
      console.log(`✅ ${reminder.reminder_type} reminder sent for appointment ${reminder.appointment_id}`);
      return { success: true, rateLimited: false };

    } catch (error: any) {
      console.error(`❌ Error processing reminder (attempt ${attempt}):`, error);
      
      onFailure(service);
      
      if (attempt === maxRetries) {
        await logFailedReminder(supabase, reminder, error.message);
        return { success: false, rateLimited: false, error: error.message };
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { success: false, rateLimited: false, error: 'Max retries exceeded' };
}

// Optimized reminder sending with circuit breaker support
async function sendEmailReminderOptimized(supabase: any, reminder: AppointmentReminderData) {
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
    throw new Error(`Email service error: ${error.message}`);
  }

  console.log('✅ Email reminder function response:', data);
}

async function sendWhatsAppReminderOptimized(supabase: any, reminder: AppointmentReminderData) {
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
    throw new Error(`WhatsApp service error: ${error.message}`);
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