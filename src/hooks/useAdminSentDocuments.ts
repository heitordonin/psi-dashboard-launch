import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SentDocument {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  due_date: string;
  competency: string;
  status: 'pending' | 'paid' | 'overdue' | 'deleted';
  file_path: string;
  created_at: string;
  marked_as_paid_at: string | null;
  hidden_from_user?: boolean;
  user_profile?: {
    full_name: string;
  } | null;
}

export const useAdminSentDocuments = (filteredUserId?: string | null, showAllUsers?: boolean) => {
  const queryClient = useQueryClient();

  const { data: sentDocuments = [], isLoading } = useQuery({
    queryKey: ['admin-sent-documents', filteredUserId, showAllUsers],
    queryFn: async () => {
      let query = supabase
        .from('admin_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!showAllUsers && filteredUserId) {
        query = query.eq('user_id', filteredUserId);
      }
      
      const { data: documents, error } = await query;
      if (error) throw error;

      // Get user profiles for all documents
      const userIds = [...new Set(documents.map(doc => doc.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map for quick profile lookup
      const profileMap = new Map(profiles.map(profile => [profile.id, profile]));

       // Calculate dynamic status based on due_date and current status
      const documentsWithStatus = documents.map(doc => {
        let calculatedStatus: 'pending' | 'paid' | 'overdue' | 'deleted' = doc.status as 'pending' | 'paid' | 'overdue';
        
        // If document is hidden from user, show as deleted
        if (doc.hidden_from_user) {
          calculatedStatus = 'deleted';
        } else if (doc.status !== 'paid') {
          const today = new Date();
          const dueDate = new Date(doc.due_date);
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          
          if (dueDate < today) {
            calculatedStatus = 'overdue';
          }
        }
        
        return {
          ...doc,
          status: calculatedStatus,
          user_profile: profileMap.get(doc.user_id) || null
        };
      });

      return documentsWithStatus as SentDocument[];
    }
  });

  const removeFromUserPanelMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('admin_documents')
        .update({ hidden_from_user: true })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sent-documents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      toast.success("Documento removido do painel do usuário");
    },
    onError: (error) => {
      console.error('Error removing document from user panel:', error);
      toast.error('Erro ao remover documento do painel do usuário');
    }
  });

  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('admin-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'overdue':
        return 'destructive';
      case 'deleted':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      case 'pending':
        return 'A Vencer';
      case 'deleted':
        return 'Documento deletado';
      default:
        return status;
    }
  };

  return {
    sentDocuments,
    isLoading,
    removeFromUserPanel: removeFromUserPanelMutation.mutate,
    isRemoving: removeFromUserPanelMutation.isPending,
    getDocumentUrl,
    getStatusBadgeVariant,
    getStatusLabel
  };
};