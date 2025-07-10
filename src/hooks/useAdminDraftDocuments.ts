import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export interface DraftDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  user_id?: string;
  competency?: string;
  due_date?: string;
  amount?: number;
  observations?: string;
  isComplete: boolean;
  isProcessingOCR?: boolean;
  ocrExtracted?: {
    cpf?: string;
    competency?: string;
    due_date?: string;
    amount?: number;
    confidence: {
      cpf: number;
      competency: number;
      due_date: number;
      amount: number;
    };
  };
}

export const useAdminDraftDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch draft documents from database
  const { data: draftDocuments = [], isLoading, error } = useQuery({
    queryKey: ['admin-draft-documents'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('admin_documents')
        .select('*')
        .eq('status', 'draft')
        .eq('created_by_admin_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database records to DraftDocument format
      const drafts: DraftDocument[] = await Promise.all(
        data.map(async (doc) => {
          // Get signed URL for the file
          const { data: urlData } = await supabase.storage
            .from('admin-documents')
            .createSignedUrl(doc.file_path, 3600);

          return {
            id: doc.id,
            fileName: doc.title.replace('DARF Carnê-Leão - ', ''),
            fileUrl: urlData?.signedUrl || '',
            user_id: doc.user_id,
            competency: doc.competency,
            due_date: doc.due_date,
            amount: doc.amount,
            observations: '', // Campo não salvo no banco ainda
            isComplete: !!(
              doc.user_id && 
              doc.competency && 
              doc.due_date && 
              doc.amount && 
              doc.amount > 0
            ),
            isProcessingOCR: false
          };
        })
      );

      return drafts;
    },
    enabled: !!user?.id
  });

  // Create draft document
  const createDraftMutation = useMutation({
    mutationFn: async (params: { 
      fileName: string; 
      filePath: string; 
      fileUrl: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_documents')
      .insert({
        title: `DARF Carnê-Leão - ${params.fileName}`,
        // Somente campos essenciais no upload, deixar o resto NULL
        status: 'draft',
        file_path: params.filePath,
        created_by_admin_id: user.id,
        // Campos que serão preenchidos manualmente pelo admin:
        // user_id: NULL (será definido na edição)
        // competency: NULL (será definido na edição)  
        // due_date: NULL (será definido na edição)
        // amount: NULL (será definido na edição)
      })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-draft-documents'] });
    },
    onError: (error) => {
      console.error('Error creating draft document:', error);
      toast.error('Erro ao salvar documento como rascunho');
    }
  });

  // Update draft document
  const updateDraftMutation = useMutation({
    mutationFn: async (params: {
      id: string;
      user_id?: string;
      competency?: string;
      due_date?: string;
      amount?: number;
    }) => {
      const { error } = await supabase
        .from('admin_documents')
        .update(params)
        .eq('id', params.id)
        .eq('status', 'draft');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-draft-documents'] });
    },
    onError: (error) => {
      console.error('Error updating draft document:', error);
      toast.error('Erro ao atualizar rascunho');
    }
  });

  // Delete draft document
  const deleteDraftMutation = useMutation({
    mutationFn: async (id: string) => {
      // First get the document to delete the file from storage
      const { data: doc } = await supabase
        .from('admin_documents')
        .select('file_path')
        .eq('id', id)
        .eq('status', 'draft')
        .single();

      if (doc) {
        // Delete file from storage
        await supabase.storage
          .from('admin-documents')
          .remove([doc.file_path]);
      }

      // Delete document record
      const { error } = await supabase
        .from('admin_documents')
        .delete()
        .eq('id', id)
        .eq('status', 'draft');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-draft-documents'] });
      toast.success('Rascunho removido');
    },
    onError: (error) => {
      console.error('Error deleting draft document:', error);
      toast.error('Erro ao remover rascunho');
    }
  });

  // Send draft document (change status from draft to pending)
  const sendDraftMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_documents')
        .update({ status: 'pending' })
        .eq('id', id)
        .eq('status', 'draft');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-draft-documents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sent-documents'] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Error sending draft document:', error);
      toast.error('Erro ao enviar documento');
    }
  });

  return {
    draftDocuments,
    isLoading,
    error,
    createDraft: createDraftMutation.mutate,
    updateDraft: updateDraftMutation.mutate,
    deleteDraft: deleteDraftMutation.mutate,
    sendDraft: sendDraftMutation.mutate,
    isCreating: createDraftMutation.isPending,
    isUpdating: updateDraftMutation.isPending,
    isDeleting: deleteDraftMutation.isPending,
    isSending: sendDraftMutation.isPending
  };
};