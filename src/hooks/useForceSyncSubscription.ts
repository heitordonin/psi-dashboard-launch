import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscriptionSync } from "@/contexts/SubscriptionSyncContext";

export const useForceSyncSubscription = () => {
  const { user } = useAuth();
  const { forceSync, state } = useSubscriptionSync();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const result = await forceSync();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Erro na sincronização');
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`Sincronização forçada concluída! Plano: ${data.plan}`);
      // Não recarregar a página, o contexto já invalida as queries
    },
    onError: (error) => {
      console.error('Erro na sincronização forçada:', error);
      toast.error('Erro na sincronização: ' + error.message);
    }
  });
};