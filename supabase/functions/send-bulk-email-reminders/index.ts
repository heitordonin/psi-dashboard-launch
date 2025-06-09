
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BulkReminderSummary {
  totalProcessed: number;
  sentSuccessfully: number;
  skipped: number;
  errors: number;
  details: Array<{
    paymentId: string;
    patientName: string;
    status: 'sent' | 'skipped' | 'error';
    reason?: string;
  }>;
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

    // Get the user from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Verify the user token and check if user is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { 
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Query for overdue payments that need email reminders
    const { data: overduePayments, error: queryError } = await supabaseClient
      .from('payments')
      .select(`
        id,
        patient_id,
        amount,
        due_date,
        description,
        email_reminder_sent_at,
        owner_id,
        patients!inner(
          full_name,
          email
        ),
        profiles!payments_owner_id_fkey(
          email_reminders_enabled
        )
      `)
      .is('paid_date', null) // Not yet received
      .lte('due_date', new Date().toISOString().split('T')[0]) // Overdue
      .eq('profiles.email_reminders_enabled', true) // Owner has email reminders enabled
      .not('patients.email', 'is', null) // Patient has email
      .like('patients.email', '%@%'); // Valid email format

    if (queryError) {
      console.error('Error querying overdue payments:', queryError);
      return new Response(
        JSON.stringify({ error: "Failed to query overdue payments" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Filter out payments where reminder was sent less than 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const paymentsToProcess = (overduePayments || []).filter(payment => {
      if (!payment.email_reminder_sent_at) {
        return true; // Never sent a reminder
      }
      
      const lastSent = new Date(payment.email_reminder_sent_at);
      return lastSent < threeDaysAgo; // Last reminder was more than 3 days ago
    });

    console.log(`Found ${paymentsToProcess.length} payments requiring email reminders`);

    const summary: BulkReminderSummary = {
      totalProcessed: paymentsToProcess.length,
      sentSuccessfully: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    // Process each payment
    for (const payment of paymentsToProcess) {
      try {
        // Validate email
        if (!payment.patients?.email || !payment.patients.email.includes('@')) {
          summary.skipped++;
          summary.details.push({
            paymentId: payment.id,
            patientName: payment.patients?.full_name || 'Unknown',
            status: 'skipped',
            reason: 'Invalid email address'
          });
          continue;
        }

        // Call the existing send-email-reminder function
        const { error: reminderError } = await supabaseClient.functions.invoke('send-email-reminder', {
          body: {
            paymentId: payment.id,
            recipientEmail: payment.patients.email,
            amount: payment.amount,
            patientName: payment.patients.full_name,
            dueDate: payment.due_date,
            description: payment.description
          }
        });

        if (reminderError) {
          console.error(`Error sending reminder for payment ${payment.id}:`, reminderError);
          summary.errors++;
          summary.details.push({
            paymentId: payment.id,
            patientName: payment.patients?.full_name || 'Unknown',
            status: 'error',
            reason: reminderError.message || 'Unknown error'
          });
        } else {
          // Update the email_reminder_sent_at timestamp
          await supabaseClient
            .from('payments')
            .update({ email_reminder_sent_at: new Date().toISOString() })
            .eq('id', payment.id);

          summary.sentSuccessfully++;
          summary.details.push({
            paymentId: payment.id,
            patientName: payment.patients?.full_name || 'Unknown',
            status: 'sent'
          });
        }
      } catch (error: any) {
        console.error(`Unexpected error processing payment ${payment.id}:`, error);
        summary.errors++;
        summary.details.push({
          paymentId: payment.id,
          patientName: payment.patients?.full_name || 'Unknown',
          status: 'error',
          reason: error.message || 'Unexpected error'
        });
      }
    }

    console.log('Bulk email reminders summary:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-bulk-email-reminders function:", error);
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
