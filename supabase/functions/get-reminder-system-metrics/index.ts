import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('📊 Reminder system metrics requested');
  console.log('Request method:', req.method);
  console.log('Timestamp:', new Date().toISOString());

  if (req.method === "OPTIONS") {
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

    // Get current user and verify admin status
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Parse query parameters for date filtering
    const url = new URL(req.url);
    const startDate = url.searchParams.get('start_date') || 
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago
    const endDate = url.searchParams.get('end_date') || 
      new Date().toISOString().split('T')[0]; // today
    
    console.log('Date range:', { startDate, endDate });

    // Fetch metrics summary
    const { data: metricsSummary, error: metricsError } = await supabase
      .from('appointment_reminder_metrics_summary')
      .select('*')
      .gte('execution_date', startDate)
      .lte('execution_date', endDate)
      .order('execution_date', { ascending: false });

    if (metricsError) {
      console.error('Error fetching metrics summary:', metricsError);
      throw metricsError;
    }

    // Fetch recent executions
    const { data: recentExecutions, error: executionsError } = await supabase
      .from('appointment_reminder_metrics')
      .select('*')
      .gte('started_at', `${startDate} 00:00:00`)
      .lte('started_at', `${endDate} 23:59:59`)
      .order('started_at', { ascending: false })
      .limit(50);

    if (executionsError) {
      console.error('Error fetching recent executions:', executionsError);
      throw executionsError;
    }

    // Fetch active alerts
    const { data: activeAlerts, error: alertsError } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('status', 'active')
      .order('triggered_at', { ascending: false })
      .limit(20);

    if (alertsError) {
      console.error('Error fetching active alerts:', alertsError);
      throw alertsError;
    }

    // Fetch recent logs (last 100 entries)
    const { data: recentLogs, error: logsError } = await supabase
      .from('appointment_reminder_logs')
      .select('*')
      .gte('timestamp', `${startDate} 00:00:00`)
      .lte('timestamp', `${endDate} 23:59:59`)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (logsError) {
      console.error('Error fetching recent logs:', logsError);
      throw logsError;
    }

    // Calculate overall statistics
    const totalExecutions = recentExecutions?.length || 0;
    const successfulExecutions = recentExecutions?.filter(e => e.status === 'success').length || 0;
    const failedExecutions = recentExecutions?.filter(e => e.status === 'error').length || 0;
    const avgDuration = recentExecutions?.length ? 
      recentExecutions.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / recentExecutions.length : 0;

    const totalReminders = recentExecutions?.reduce((sum, e) => sum + (e.total_reminders || 0), 0) || 0;
    const totalSuccessfulReminders = recentExecutions?.reduce((sum, e) => sum + (e.successful_reminders || 0), 0) || 0;
    const totalFailedReminders = recentExecutions?.reduce((sum, e) => sum + (e.failed_reminders || 0), 0) || 0;
    const totalRateLimitedReminders = recentExecutions?.reduce((sum, e) => sum + (e.rate_limited_reminders || 0), 0) || 0;

    const overallSuccessRate = totalReminders > 0 ? 
      ((totalSuccessfulReminders / totalReminders) * 100).toFixed(2) : '0.00';

    // Count alerts by severity
    const criticalAlerts = activeAlerts?.filter(a => a.severity === 'critical').length || 0;
    const highAlerts = activeAlerts?.filter(a => a.severity === 'high').length || 0;
    const mediumAlerts = activeAlerts?.filter(a => a.severity === 'medium').length || 0;
    const lowAlerts = activeAlerts?.filter(a => a.severity === 'low').length || 0;

    // Group logs by level
    const logsByLevel = {
      critical: recentLogs?.filter(log => log.log_level === 'critical').length || 0,
      error: recentLogs?.filter(log => log.log_level === 'error').length || 0,
      warn: recentLogs?.filter(log => log.log_level === 'warn').length || 0,
      info: recentLogs?.filter(log => log.log_level === 'info').length || 0,
      debug: recentLogs?.filter(log => log.log_level === 'debug').length || 0,
    };

    const response = {
      date_range: { start_date: startDate, end_date: endDate },
      overall_statistics: {
        total_executions: totalExecutions,
        successful_executions: successfulExecutions,
        failed_executions: failedExecutions,
        success_rate_percentage: ((successfulExecutions / Math.max(totalExecutions, 1)) * 100).toFixed(2),
        avg_duration_ms: Math.round(avgDuration),
        total_reminders_processed: totalReminders,
        total_successful_reminders: totalSuccessfulReminders,
        total_failed_reminders: totalFailedReminders,
        total_rate_limited_reminders: totalRateLimitedReminders,
        overall_reminder_success_rate: overallSuccessRate
      },
      alerts_summary: {
        total_active_alerts: activeAlerts?.length || 0,
        critical: criticalAlerts,
        high: highAlerts,
        medium: mediumAlerts,
        low: lowAlerts
      },
      logs_summary: logsByLevel,
      daily_metrics: metricsSummary || [],
      recent_executions: recentExecutions || [],
      active_alerts: activeAlerts || [],
      recent_logs: recentLogs?.slice(0, 50) || [], // Limit to 50 most recent logs
      timestamp: new Date().toISOString()
    };

    console.log('✅ Metrics compiled successfully');
    console.log('Statistics:', response.overall_statistics);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );

  } catch (error: any) {
    console.error("💥 Error in reminder system metrics function:", error);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        function: 'get-reminder-system-metrics'
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

serve(handler);