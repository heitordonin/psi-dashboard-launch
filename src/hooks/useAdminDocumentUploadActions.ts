import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadedDocument } from "@/types/adminDocument";

export const useAdminDocumentUploadActions = (
  uploadedFiles: UploadedDocument[],
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedDocument[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  userId?: string
) => {
  const uploadFiles = async (files: File[], processDocumentOCR: (id: string, file: File) => Promise<void>) => {
    if (!userId) return;

    setIsLoading(true);
    const newDocuments: UploadedDocument[] = [];
    const uploadedFilesPairs: { doc: UploadedDocument, file: File }[] = [];

    try {
      for (const file of files) {
        // Validate file type
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} não é um arquivo PDF válido`);
          continue;
        }

        // Generate unique file path
        const fileId = crypto.randomUUID();
        const filePath = `${userId}/${fileId}_${file.name}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('admin-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get signed URL for preview
        const { data: urlData, error: urlError } = await supabase.storage
          .from('admin-documents')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (urlError) throw urlError;

        const document: UploadedDocument = {
          id: fileId,
          fileName: file.name,
          fileUrl: urlData.signedUrl,
          isComplete: false,
          isSent: false,
          isProcessingOCR: false
        };

        newDocuments.push(document);
        uploadedFilesPairs.push({ doc: document, file });
      }

      setUploadedFiles(prev => [...prev, ...newDocuments]);
      toast.success(`${newDocuments.length} arquivo(s) carregado(s) com sucesso!`);

      // Process OCR for each uploaded file
      for (const { doc, file } of uploadedFilesPairs) {
        processDocumentOCR(doc.id, file);
      }

    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erro ao fazer upload dos arquivos");
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocument = async (documentId: string, updateData: any) => {
    setUploadedFiles(prev => 
      prev.map(doc => {
        if (doc.id === documentId) {
          const updated = { ...doc, ...updateData };
          updated.isComplete = !!(
            updated.user_id && 
            updated.competency && 
            updated.due_date && 
            updated.amount && 
            updated.amount > 0
          );
          return updated;
        }
        return doc;
      })
    );
  };

  const deleteDocument = (documentId: string) => {
    setUploadedFiles(prev => {
      const filtered = prev.filter(doc => doc.id !== documentId);
      if (filtered.length === 0) {
        localStorage.removeItem('admin_uploaded_documents');
      }
      return filtered;
    });
    toast.success("Documento removido");
  };

  return {
    uploadFiles,
    updateDocument,
    deleteDocument
  };
};