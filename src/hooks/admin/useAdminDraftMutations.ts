import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { sendDocumentNotificationEmail } from "@/utils/adminDocumentNotification";

export const useAdminDraftMutations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
          status: 'draft',
          file_path: params.filePath,
          created_by_admin_id: user.id,
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
      // First update the status
      const { error } = await supabase
        .from('admin_documents')
        .update({ status: 'pending' })
        .eq('id', id)
        .eq('status', 'draft');

      if (error) throw error;

      // Then get the updated document data for email
      const { data: documentData, error: fetchError } = await supabase
        .from('admin_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Send notification email
      const emailSent = await sendDocumentNotificationEmail(id, documentData);
      
      return { documentData, emailSent };
    },
    onSuccess: ({ emailSent }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-draft-documents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sent-documents'] });
      
      if (emailSent) {
        toast.success('Documento enviado e usuário notificado por email!');
      } else {
        toast.warning('Documento enviado, mas houve erro ao enviar notificação por email');
      }
    },
    onError: (error) => {
      console.error('Error sending draft document:', error);
      toast.error('Erro ao enviar documento');
    }
  });

  return {
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