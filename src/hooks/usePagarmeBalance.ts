
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";

interface PagarmeBalance {
  available_amount: number;
  waiting_funds_amount: number;
  transferred_amount?: number;
}

export const usePagarmeBalance = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pagarme-balance', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('Fetching Pagar.me balance...');
      
      const { data, error } = await supabase.functions.invoke('get-pagarme-balance', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching balance:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch balance');
      }

      console.log('Balance data received:', data.data);
      return data.data as PagarmeBalance;
    },
    enabled: !!user,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
