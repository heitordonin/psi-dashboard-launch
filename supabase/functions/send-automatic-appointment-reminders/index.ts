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
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log('🔄 Optimized automatic appointment reminders started');
  console.log('Request method:', req.method);
  console.log('Execution ID:', executionId);
  console.log('Timestamp:', new Date().toISOString());

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  let supabase: any;

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized');

    // Log execution start
    await logEvent(supabase, executionId, 'info', 'Execution started', {
      timestamp: new Date().toISOString(),
      trigger: 'cron_job'
    });

    // Register execution start in metrics
    await logMetrics(supabase, executionId, 'running');

    // Check global rate limit
    if (!checkGlobalRateLimit()) {
      const message = 'Global rate limit exceeded, skipping this execution';
      console.warn(`⚠️ ${message}`);
      
      await logEvent(supabase, executionId, 'warn', message);
      await logMetrics(supabase, executionId, 'success', Date.now() - startTime, 0, 0, 0, 0, null, {
        skipped_reason: 'global_rate_limit'
      });

      return new Response(
        JSON.stringify({ 
          message,
          execution_id: executionId,
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

    await logEvent(supabase, executionId, 'info', 'Fetching pending reminders', {
      window_start: now.toISOString(),
      window_end: windowEnd.toISOString()
    });

    // Get all pending reminders (no implicit JOINs)
    const queryStartTime = Date.now();
    const remindersToSend = await getPendingReminders(supabase, now, windowEnd);
    const queryDuration = Date.now() - queryStartTime;
    
    console.log(`📋 Found ${remindersToSend.length} reminders to process`);

    await logEvent(supabase, executionId, 'info', 'Query completed', {
      reminders_found: remindersToSend.length,
      query_duration_ms: queryDuration
    });

    if (remindersToSend.length === 0) {
      const duration = Date.now() - startTime;
      await logMetrics(supabase, executionId, 'success', duration, 0, 0, 0, 0, null, {
        query_duration_ms: queryDuration
      });

      return new Response(
        JSON.stringify({ 
          message: 'No reminders to process',
          execution_id: executionId,
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
    const processingStartTime = Date.now();
    const results = await processBatchedReminders(supabase, remindersToSend, executionId);
    const processingDuration = Date.now() - processingStartTime;
    const totalDuration = Date.now() - startTime;

    console.log(`🏁 Processing complete. Success: ${results.successCount}, Errors: ${results.errorCount}, Rate Limited: ${results.rateLimitedCount}`);

    await logEvent(supabase, executionId, 'info', 'Execution completed', {
      total_reminders: remindersToSend.length,
      successful_reminders: results.successCount,
      failed_reminders: results.errorCount,
      rate_limited_reminders: results.rateLimitedCount,
      processing_duration_ms: processingDuration,
      total_duration_ms: totalDuration
    });

    // Check for critical failures and create alerts
    if (results.errorCount > 0) {
      const errorRate = (results.errorCount / remindersToSend.length) * 100;
      if (errorRate > 50) { // Alert if more than 50% failed
        await createAlert(supabase, 'high_error_rate', 'critical', 
          'High Error Rate in Reminder System', 
          `Error rate: ${errorRate.toFixed(2)}% (${results.errorCount}/${remindersToSend.length} failures)`,
          {
            execution_id: executionId,
            error_rate: errorRate,
            failed_count: results.errorCount,
            total_count: remindersToSend.length
          }
        );
      }
    }

    // Register final metrics
    await logMetrics(supabase, executionId, 'success', totalDuration, 
      remindersToSend.length, results.successCount, results.errorCount, results.rateLimitedCount,
      null, {
        query_duration_ms: queryDuration,
        processing_duration_ms: processingDuration,
        batches_processed: Math.ceil(remindersToSend.length / BATCH_SIZE)
      }
    );

    return new Response(
      JSON.stringify({ 
        message: 'Automatic reminders processed',
        execution_id: executionId,
        processed: remindersToSend.length,
        success: results.successCount,
        errors: results.errorCount,
        rateLimited: results.rateLimitedCount,
        duration_ms: totalDuration,
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
    const duration = Date.now() - startTime;
    console.error("💥 Error in automatic reminders function:", error);
    console.error("Error stack:", error.stack);

    // Log critical error
    if (supabase) {
      await logEvent(supabase, executionId, 'critical', 'Execution failed with critical error', 
        {}, null, null, null, {
          error_message: error.message,
          error_stack: error.stack
        }
      );

      await logMetrics(supabase, executionId, 'error', duration, 0, 0, 0, 0, error.message);

      // Create critical alert
      await createAlert(supabase, 'critical_failure', 'critical',
        'Critical Failure in Reminder System',
        `Execution ${executionId} failed with error: ${error.message}`,
        {
          execution_id: executionId,
          error_message: error.message,
          error_stack: error.stack,
          duration_ms: duration
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        execution_id: executionId,
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

// Query without implicit JOINs; fetch related data separately to avoid FK requirements
async function getPendingReminders(supabase: any, now: Date, windowEnd: Date): Promise<AppointmentReminderData[]> {
  console.log('🔍 Querying pending reminders (separate fetches)...');

  const { data: appointments, error: apptError } = await supabase
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
      status
    `)
    .eq('status', 'scheduled')
    .gte('start_datetime', now.toISOString())
    .lte('start_datetime', new Date(now.getTime() + (24 * 60 * 60 * 1000)).toISOString())
    .limit(500);

  if (apptError) {
    console.error('❌ Error fetching appointments:', apptError);
    throw apptError;
  }

  if (!appointments || appointments.length === 0) {
    console.log('📭 No scheduled appointments found in window');
    return [];
  }

  const userIds = Array.from(new Set(appointments.map((a: any) => a.user_id).filter(Boolean)));

  // Fetch agenda settings for these users
  const { data: settings, error: settingsErr } = await supabase
    .from('agenda_settings')
    .select(`
      user_id,
      timezone,
      email_reminder_1_enabled,
      email_reminder_1_minutes,
      email_reminder_2_enabled,
      email_reminder_2_minutes,
      whatsapp_reminder_1_enabled,
      whatsapp_reminder_1_minutes,
      whatsapp_reminder_2_enabled,
      whatsapp_reminder_2_minutes
    `)
    .in('user_id', userIds);

  if (settingsErr) {
    console.warn('⚠️ Warning fetching agenda_settings:', settingsErr);
  }
  const settingsMap = new Map<string, any>((settings || []).map((s: any) => [s.user_id, s]));

  // Fetch profiles for therapist names
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, full_name, display_name')
    .in('id', userIds);
  if (profilesErr) {
    console.warn('⚠️ Warning fetching profiles:', profilesErr);
  }
  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

  const reminders: AppointmentReminderData[] = [];

  for (const appointment of appointments) {
    const settings = settingsMap.get(appointment.user_id) || {};
    const profile = profileMap.get(appointment.user_id) || {};
    const appointmentStart = new Date(appointment.start_datetime);
    const therapistName = profile.full_name || profile.display_name || 'Terapeuta';
    const timezone = settings.timezone || 'America/Sao_Paulo';

    // Email reminders
    if (appointment.send_email_reminder && appointment.patient_email) {
      if (settings.email_reminder_1_enabled && settings.email_reminder_1_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (settings.email_reminder_1_minutes * 60 * 1000));
        if (sendTime >= now && sendTime <= windowEnd && (!appointment.email_reminder_sent_at || new Date(appointment.email_reminder_sent_at) < sendTime)) {
          reminders.push({
            appointment_id: appointment.id,
            user_id: appointment.user_id,
            patient_name: appointment.patient_name,
            patient_email: appointment.patient_email,
            patient_phone: appointment.patient_phone,
            title: appointment.title,
            start_datetime: appointment.start_datetime,
            therapist_name: therapistName,
            timezone,
            reminder_type: 'email',
            reminder_number: 1,
            minutes_before: settings.email_reminder_1_minutes
          });
        }
      }
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
            therapist_name: therapistName,
            timezone,
            reminder_type: 'email',
            reminder_number: 2,
            minutes_before: settings.email_reminder_2_minutes
          });
        }
      }
    }

    // WhatsApp reminders
    if (appointment.send_whatsapp_reminder && appointment.patient_phone) {
      if (settings.whatsapp_reminder_1_enabled && settings.whatsapp_reminder_1_minutes) {
        const sendTime = new Date(appointmentStart.getTime() - (settings.whatsapp_reminder_1_minutes * 60 * 1000));
        if (sendTime >= now && sendTime <= windowEnd && (!appointment.whatsapp_reminder_sent_at || new Date(appointment.whatsapp_reminder_sent_at) < sendTime)) {
          reminders.push({
            appointment_id: appointment.id,
            user_id: appointment.user_id,
            patient_name: appointment.patient_name,
            patient_email: appointment.patient_email,
            patient_phone: appointment.patient_phone,
            title: appointment.title,
            start_datetime: appointment.start_datetime,
            therapist_name: therapistName,
            timezone,
            reminder_type: 'whatsapp',
            reminder_number: 1,
            minutes_before: settings.whatsapp_reminder_1_minutes
          });
        }
      }
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
            therapist_name: therapistName,
            timezone,
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
async function processBatchedReminders(supabase: any, reminders: AppointmentReminderData[], executionId: string): Promise<{
  successCount: number;
  errorCount: number;
  rateLimitedCount: number;
}> {
  console.log('🔄 Processing reminders in batches...');
  
  await logEvent(supabase, executionId, 'info', 'Starting batch processing', {
    total_reminders: reminders.length,
    batch_size: BATCH_SIZE,
    max_concurrent_batches: MAX_CONCURRENT_BATCHES
  });
  
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
        
        await logEvent(supabase, executionId, 'debug', `Processing batch ${batchIndex + 1}`, {
          batch_index: batchIndex + 1,
          batch_size: batch.length,
          total_batches: batches.length
        });
        
        const batchResults = await Promise.allSettled(
          batch.map(reminder => processReminderWithRetry(supabase, reminder, executionId))
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

// Retry logic with exponential backoff and structured logging
async function processReminderWithRetry(supabase: any, reminder: AppointmentReminderData, executionId: string, maxRetries = 3): Promise<{
  success: boolean;
  rateLimited: boolean;
  error?: string;
}> {
  // Check user rate limit
  if (!checkUserRateLimit(reminder.user_id)) {
    console.warn(`⚠️ Rate limit exceeded for user ${reminder.user_id}`);
    
    await logEvent(supabase, executionId, 'warn', 'User rate limit exceeded', {
      user_id: reminder.user_id,
      appointment_id: reminder.appointment_id,
      reminder_type: reminder.reminder_type
    }, reminder.appointment_id, reminder.user_id, reminder.reminder_type);
    
    return { success: false, rateLimited: true };
  }

  const service = reminder.reminder_type === 'email' ? 'email-service' : 'whatsapp-service';
  
  // Check circuit breaker
  if (!canExecute(service)) {
    console.warn(`⚠️ Circuit breaker open for ${service}`);
    
    await logEvent(supabase, executionId, 'warn', 'Circuit breaker open', {
      service,
      appointment_id: reminder.appointment_id,
      reminder_type: reminder.reminder_type
    }, reminder.appointment_id, reminder.user_id, reminder.reminder_type);
    
    return { success: false, rateLimited: false, error: 'Circuit breaker open' };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Processing reminder attempt ${attempt}/${maxRetries} for appointment ${reminder.appointment_id} (${reminder.reminder_type})`);
      
      await logEvent(supabase, executionId, 'debug', `Reminder attempt ${attempt}`, {
        attempt,
        max_retries: maxRetries,
        appointment_id: reminder.appointment_id,
        reminder_type: reminder.reminder_type,
        patient_name: reminder.patient_name
      }, reminder.appointment_id, reminder.user_id, reminder.reminder_type);
      
      if (reminder.reminder_type === 'email' && reminder.patient_email) {
        await sendEmailReminderOptimized(supabase, reminder);
        await markReminderSent(supabase, reminder, 'email');
      } else if (reminder.reminder_type === 'whatsapp' && reminder.patient_phone) {
        await sendWhatsAppReminderOptimized(supabase, reminder);
        await markReminderSent(supabase, reminder, 'whatsapp');
      } else {
        console.log(`⚠️ Skipping reminder - missing contact info: ${reminder.reminder_type} for appointment ${reminder.appointment_id}`);
        
        await logEvent(supabase, executionId, 'warn', 'Skipping reminder - missing contact info', {
          reminder_type: reminder.reminder_type,
          has_email: !!reminder.patient_email,
          has_phone: !!reminder.patient_phone
        }, reminder.appointment_id, reminder.user_id, reminder.reminder_type);
        
        return { success: false, rateLimited: false, error: 'Missing contact info' };
      }

      onSuccess(service);
      console.log(`✅ ${reminder.reminder_type} reminder sent for appointment ${reminder.appointment_id}`);
      
      await logEvent(supabase, executionId, 'info', `${reminder.reminder_type} reminder sent successfully`, {
        appointment_id: reminder.appointment_id,
        patient_name: reminder.patient_name,
        reminder_number: reminder.reminder_number,
        minutes_before: reminder.minutes_before
      }, reminder.appointment_id, reminder.user_id, reminder.reminder_type);
      
      return { success: true, rateLimited: false };

    } catch (error: any) {
      console.error(`❌ Error processing reminder (attempt ${attempt}):`, error);
      
      await logEvent(supabase, executionId, 'error', `Reminder attempt ${attempt} failed`, {
        attempt,
        max_retries: maxRetries,
        error_message: error.message
      }, reminder.appointment_id, reminder.user_id, reminder.reminder_type, {
        error_message: error.message,
        error_stack: error.stack
      });
      
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

// Monitoring utility functions
async function logMetrics(
  supabase: any, 
  executionId: string, 
  status: string, 
  durationMs?: number,
  totalReminders: number = 0,
  successfulReminders: number = 0, 
  failedReminders: number = 0,
  rateLimitedReminders: number = 0,
  errorMessage?: string | null,
  performanceData: any = {}
) {
  try {
    const { error } = await supabase.rpc('log_reminder_execution_metrics', {
      p_execution_id: executionId,
      p_status: status,
      p_duration_ms: durationMs,
      p_total_reminders: totalReminders,
      p_successful_reminders: successfulReminders,
      p_failed_reminders: failedReminders,
      p_rate_limited_reminders: rateLimitedReminders,
      p_error_message: errorMessage,
      p_performance_data: performanceData
    });

    if (error) {
      console.error('Failed to log metrics:', error);
    }
  } catch (error) {
    console.error('Error logging metrics:', error);
  }
}

async function logEvent(
  supabase: any,
  executionId: string, 
  level: string,
  message: string,
  context: any = {},
  appointmentId?: string | null,
  userId?: string | null,
  reminderType?: string | null,
  errorDetails?: any | null
) {
  try {
    const { error } = await supabase.rpc('log_reminder_event', {
      p_execution_id: executionId,
      p_level: level,
      p_message: message,
      p_context: context,
      p_appointment_id: appointmentId,
      p_user_id: userId,
      p_reminder_type: reminderType,
      p_error_details: errorDetails
    });

    if (error) {
      console.error('Failed to log event:', error);
    }
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

async function createAlert(
  supabase: any,
  alertType: string,
  severity: string,
  title: string,
  message: string,
  details: any = {},
  executionId?: string
) {
  try {
    const { error } = await supabase.rpc('create_system_alert', {
      p_alert_type: alertType,
      p_severity: severity,
      p_title: title,
      p_message: message,
      p_details: details,
      p_execution_id: executionId
    });

    if (error) {
      console.error('Failed to create alert:', error);
    } else {
      console.log(`🚨 Created ${severity} alert: ${title}`);
    }
  } catch (error) {
    console.error('Error creating alert:', error);
  }
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