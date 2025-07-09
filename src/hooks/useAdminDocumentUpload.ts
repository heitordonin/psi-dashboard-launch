import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useAdminDocumentUsers } from "./useAdminDocumentUsers";
import { useAdminDocumentOCR } from "./useAdminDocumentOCR";
import { useAdminDraftDocuments, DraftDocument } from "./useAdminDraftDocuments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAdminDocumentUpload = () => {
  const { user } = useAuth();
  const { users } = useAdminDocumentUsers();
  
  // Use new draft documents system
  const {
    draftDocuments,
    isLoading: isDraftLoading,
    createDraft,
    updateDraft,
    deleteDraft,
    sendDraft,
    isCreating,
    isUpdating,
    isDeleting,
    isSending
  } = useAdminDraftDocuments();

  const isLoading = isDraftLoading || isCreating || isUpdating || isDeleting || isSending;

  // Upload files and create drafts
  const uploadFiles = async (files: File[]) => {
    if (!user?.id) return;

    for (const file of files) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} não é um arquivo PDF válido`);
        continue;
      }

      try {
        // Generate unique file path
        const fileId = crypto.randomUUID();
        const filePath = `${user.id}/${fileId}_${file.name}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('admin-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get signed URL for preview
        const { data: urlData, error: urlError } = await supabase.storage
          .from('admin-documents')
          .createSignedUrl(filePath, 3600);

        if (urlError) throw urlError;

        // Create draft in database
        createDraft({
          fileName: file.name,
          filePath: filePath,
          fileUrl: urlData.signedUrl
        });

        // Process OCR for the file
        await processDocumentOCR(fileId, file);

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast.error(`Erro ao fazer upload de ${file.name}`);
      }
    }
  };

  // Update document
  const updateDocument = async (documentId: string, updateData: any) => {
    updateDraft({
      id: documentId,
      ...updateData
    });
  };

  // Delete document
  const deleteDocument = (documentId: string) => {
    deleteDraft(documentId);
  };

  // Send single document
  const sendSingleDocument = async (documentId: string) => {
    const document = draftDocuments.find(doc => doc.id === documentId);
    if (!document || !document.isComplete) {
      toast.error("Documento não encontrado ou incompleto");
      return;
    }

    sendDraft(documentId);
  };

  // Send all complete documents
  const sendDocuments = async () => {
    const completeDocuments = draftDocuments.filter(doc => doc.isComplete);
    if (completeDocuments.length === 0) {
      toast.error("Nenhum documento completo para enviar");
      return;
    }

    for (const doc of completeDocuments) {
      sendDraft(doc.id);
    }
  };

  // Process OCR for uploaded documents
  const processDocumentOCR = async (documentId: string, file: File) => {
    try {
      const { error } = await supabase.functions.invoke('extract-darf-data', {
        body: { file: await fileToBase64(file) }
      });

      if (error) throw error;

      // Note: OCR results would need to be handled in a callback or subscription
      // For now, we'll just mark that OCR was attempted
    } catch (error) {
      console.error("Error processing OCR:", error);
      toast.error("Erro ao processar OCR do documento");
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const canSendDocuments = draftDocuments.some(doc => doc.isComplete);

  return {
    uploadedFiles: draftDocuments,
    users,
    isLoading,
    uploadFiles,
    updateDocument,
    deleteDocument,
    sendDocuments,
    sendSingleDocument,
    canSendDocuments,
    processDocumentOCR
  };
};