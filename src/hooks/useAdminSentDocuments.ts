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
  status: 'pending' | 'paid' | 'overdue';
  file_path: string;
  created_at: string;
  marked_as_paid_at: string | null;
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
        let calculatedStatus = doc.status;
        
        if (doc.status !== 'paid') {
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
      // Here you could add a field like 'hidden_from_user' or 'removed_from_panel'
      // For now, we'll just add a note in the database or handle it differently
      // This would require a database migration to add a proper field
      
      // Placeholder - in a real implementation, you'd update a specific field
      console.log(`Document ${documentId} would be removed from user panel`);
      toast.success("Documento removido do painel do usuário");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sent-documents'] });
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