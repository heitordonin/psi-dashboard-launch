import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemHealthMetrics {
  timestamp: string
  requestId: string
  messaging: {
    totalMessagesSent24h: number
    successRate: number
    failureRate: number
    avgLatency: number
    topErrorTypes: Array<{ type: string; count: number }>
  }
  rateLimiting: {
    usersHittingLimit: number
    avgAttemptsPerUser: number
  }
  database: {
    avgQueryTime: number
    connectionHealth: 'healthy' | 'degraded' | 'failed'
  }
  external: {
    twilioHealth: 'healthy' | 'degraded' | 'failed'
    avgTwilioLatency: number
  }
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    uptime: number
  }
}

serve(async (req) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  // Structured logging
  const log = (level: 'info' | 'warn' | 'error', message: string, context?: any) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      requestId,
      message,
      service: 'whatsapp-system-health',
      ...context
    }));
  };
  
  log('info', 'System health check started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Messaging Metrics
    log('info', 'Collecting messaging metrics');
    const messagingStartTime = performance.now();
    
    const { data: messageStats, error: messageStatsError } = await supabaseClient
      .from('whatsapp_logs')
      .select('status, created_at')
      .gte('created_at', twentyFourHoursAgo.toISOString());

    if (messageStatsError) {
      log('error', 'Failed to fetch message stats', { error: messageStatsError });
      throw new Error(`Database query failed: ${messageStatsError.message}`);
    }

    const totalMessages = messageStats?.length || 0;
    const successfulMessages = messageStats?.filter(m => m.status === 'sent' || m.status === 'delivered' || m.status === 'read').length || 0;
    const failedMessages = messageStats?.filter(m => m.status === 'failed').length || 0;

    // 2. Rate Limiting Metrics
    log('info', 'Collecting rate limiting metrics');
    const { data: rateLimitStats } = await supabaseClient
      .from('phone_verification_codes')
      .select('user_id')
      .gte('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString()); // Last hour

    const usersWithCodes = new Set(rateLimitStats?.map(r => r.user_id)).size;
    const totalCodes = rateLimitStats?.length || 0;

    // 3. Database Health Check
    log('info', 'Checking database health');
    const dbHealthStartTime = performance.now();
    const { error: dbHealthError } = await supabaseClient
      .from('whatsapp_logs')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const dbQueryTime = performance.now() - dbHealthStartTime;
    const dbHealth = dbHealthError ? 'failed' : (dbQueryTime > 1000 ? 'degraded' : 'healthy');

    // 4. External Services Health (Twilio check)
    log('info', 'Checking external services');
    let twilioHealth: 'healthy' | 'degraded' | 'failed' = 'healthy';
    let avgTwilioLatency = 0;

    try {
      const twilioTestStartTime = performance.now();
      // Simple Twilio API health check (get account info)
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      
      if (accountSid && authToken) {
        const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
          }
        });
        
        avgTwilioLatency = performance.now() - twilioTestStartTime;
        
        if (!twilioResponse.ok) {
          twilioHealth = 'failed';
        } else if (avgTwilioLatency > 2000) {
          twilioHealth = 'degraded';
        }
      } else {
        twilioHealth = 'failed';
        log('warn', 'Twilio credentials not configured');
      }
    } catch (error) {
      twilioHealth = 'failed';
      log('error', 'Twilio health check failed', { error: error.message });
    }

    // 5. Calculate Overall Status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (dbHealth === 'failed' || twilioHealth === 'failed') {
      overallStatus = 'unhealthy';
    } else if (dbHealth === 'degraded' || twilioHealth === 'degraded' || (totalMessages > 0 && (successfulMessages / totalMessages) < 0.95)) {
      overallStatus = 'degraded';
    }

    // Construct health metrics
    const healthMetrics: SystemHealthMetrics = {
      timestamp: now.toISOString(),
      requestId,
      messaging: {
        totalMessagesSent24h: totalMessages,
        successRate: totalMessages > 0 ? (successfulMessages / totalMessages) : 1,
        failureRate: totalMessages > 0 ? (failedMessages / totalMessages) : 0,
        avgLatency: performance.now() - messagingStartTime,
        topErrorTypes: [] // Could be enhanced to analyze error patterns
      },
      rateLimiting: {
        usersHittingLimit: usersWithCodes,
        avgAttemptsPerUser: usersWithCodes > 0 ? (totalCodes / usersWithCodes) : 0
      },
      database: {
        avgQueryTime: dbQueryTime,
        connectionHealth: dbHealth as 'healthy' | 'degraded' | 'failed'
      },
      external: {
        twilioHealth,
        avgTwilioLatency
      },
      overall: {
        status: overallStatus,
        uptime: performance.now() - startTime
      }
    };

    log('info', 'System health check completed', {
      overallStatus,
      totalMessages,
      successRate: healthMetrics.messaging.successRate,
      dbHealth,
      twilioHealth,
      executionTimeMs: performance.now() - startTime
    });

    return new Response(
      JSON.stringify(healthMetrics),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    log('error', 'System health check failed', {
      error: error.message,
      stack: error.stack,
      executionTimeMs: performance.now() - startTime
    });

    return new Response(
      JSON.stringify({ 
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
        requestId,
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});