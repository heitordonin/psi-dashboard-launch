
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export interface EmailLog {
  id: string;
  recipient_email: string;
  email_type: string;
  subject: string | null;
  content: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  payment_id: string | null;
  owner_id: string;
  patients?: {
    full_name: string;
  };
}

export const useEmailLogs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('email_logs')
        .select(`
          *,
          payments!email_logs_payment_id_fkey (
            patients!payments_patient_id_fkey (
              full_name
            )
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Flatten the data structure for easier use
      return data.map(log => ({
        ...log,
        patients: log.payments?.patients
      }));
    },
    enabled: !!user?.id
  });
};
