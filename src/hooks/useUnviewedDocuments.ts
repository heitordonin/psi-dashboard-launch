import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export const useUnviewedDocuments = () => {
  const { user } = useAuth();

  const { data: hasUnviewedDocuments = false, isLoading } = useQuery({
    queryKey: ['unviewed-documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('admin_documents')
        .select('id')
        .eq('user_id', user.id)
        .eq('hidden_from_user', false)
        .is('viewed_at', null)
        .limit(1);

      if (error) {
        console.error('Error checking unviewed documents:', error);
        return false;
      }

      return data && data.length > 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Verificar a cada 30 segundos
  });

  return {
    hasUnviewedDocuments,
    isLoading
  };
};