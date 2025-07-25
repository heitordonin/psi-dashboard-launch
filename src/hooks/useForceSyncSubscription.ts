import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export const useForceSyncSubscription = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.functions.invoke('force-subscription-sync', {
        body: { userId: user.id }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sincronização forçada concluída! Plano: ${data.plan}`);
      // Recarregar a página para atualizar o estado
      window.location.reload();
    },
    onError: (error) => {
      console.error('Erro na sincronização forçada:', error);
      toast.error('Erro na sincronização: ' + error.message);
    }
  });
};