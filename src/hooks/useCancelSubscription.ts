import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CancelSubscriptionParams {
  immediate?: boolean;
}

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ immediate = false }: CancelSubscriptionParams = {}) => {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { immediate }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidar as queries relacionadas a assinatura
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['patient-limit'] });
      queryClient.invalidateQueries({ queryKey: ['plan-features'] });
    },
    onError: (error) => {
      console.error('Error cancelling subscription:', error);
      toast.error('Erro ao cancelar plano: ' + error.message);
    }
  });
};