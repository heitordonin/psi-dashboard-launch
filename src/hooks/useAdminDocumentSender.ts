import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadedDocument } from "@/types/adminDocument";

export const useAdminDocumentSender = (
  uploadedFiles: UploadedDocument[],
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedDocument[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  userId?: string
) => {
  const sendNotificationEmail = async (document: UploadedDocument, documentId: string) => {
    try {
      const { error: emailError } = await supabase.functions
        .invoke('send-document-notification', {
          body: {
            user_id: document.user_id,
            document_id: documentId,
            title: `DARF Carnê-Leão - ${document.fileName}`,
            amount: document.amount,
            due_date: document.due_date,
            competency: document.competency
          }
        });

      if (emailError) {
        console.error("Error sending notification email:", emailError);
        return false;
      }
      return true;
    } catch (emailError) {
      console.error("Error sending notification email:", emailError);
      return false;
    }
  };

  const sendSingleDocument = async (documentId: string) => {
    if (!userId) return;

    const document = uploadedFiles.find(doc => doc.id === documentId);
    if (!document || !document.isComplete) {
      toast.error("Documento não encontrado ou incompleto");
      return;
    }

    setIsLoading(true);
    try {
      // Create document record in database
      const { data: insertedDocument, error } = await supabase
        .from('admin_documents')
        .insert({
          user_id: document.user_id,
          title: `DARF Carnê-Leão - ${document.fileName}`,
          amount: document.amount,
          due_date: document.due_date,
          competency: document.competency,
          status: 'pending',
          file_path: `${userId}/${document.id}_${document.fileName}`,
          created_by_admin_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification email
      const emailSent = await sendNotificationEmail(document, insertedDocument.id);
      
      if (emailSent) {
        toast.success("Documento enviado e usuário notificado por email!");
      } else {
        toast.warning("Documento enviado, mas houve erro ao enviar notificação por email");
      }

      // Remove document from local list after successful send
      setUploadedFiles(prev => {
        const filtered = prev.filter(doc => doc.id !== documentId);
        if (filtered.length === 0) {
          localStorage.removeItem('admin_uploaded_documents');
        }
        return filtered;
      });

    } catch (error) {
      console.error("Error sending document:", error);
      toast.error("Erro ao enviar documento");
    } finally {
      setIsLoading(false);
    }
  };

  const sendDocuments = async () => {
    if (!userId) return;

    const completeDocuments = uploadedFiles.filter(doc => doc.isComplete && !doc.isSent);
    if (completeDocuments.length === 0) {
      toast.error("Nenhum documento completo para enviar");
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let emailSuccessCount = 0;
    
    try {
      for (const doc of completeDocuments) {
        // Create document record in database
        const { data: insertedDocument, error } = await supabase
          .from('admin_documents')
          .insert({
            user_id: doc.user_id,
            title: `DARF Carnê-Leão - ${doc.fileName}`,
            amount: doc.amount,
            due_date: doc.due_date,
            competency: doc.competency,
            status: 'pending',
            file_path: `${userId}/${doc.id}_${doc.fileName}`,
            created_by_admin_id: userId
          })
          .select()
          .single();

        if (error) throw error;
        
        successCount++;

        // Send notification email for each document
        const emailSent = await sendNotificationEmail(doc, insertedDocument.id);
        if (emailSent) {
          emailSuccessCount++;
        }
      }

      // Remove all sent documents from local list
      const sentDocumentIds = completeDocuments.map(doc => doc.id);
      setUploadedFiles(prev => {
        const filtered = prev.filter(doc => !sentDocumentIds.includes(doc.id));
        if (filtered.length === 0) {
          localStorage.removeItem('admin_uploaded_documents');
        }
        return filtered;
      });

      // Show appropriate success message
      if (emailSuccessCount === successCount) {
        toast.success(`${successCount} documento(s) enviado(s) e usuários notificados por email!`);
      } else if (emailSuccessCount > 0) {
        toast.warning(`${successCount} documento(s) enviado(s). ${emailSuccessCount} notificação(ões) por email enviada(s).`);
      } else {
        toast.warning(`${successCount} documento(s) enviado(s), mas houve erro ao enviar notificações por email.`);
      }

    } catch (error) {
      console.error("Error sending documents:", error);
      toast.error("Erro ao enviar documentos");
    } finally {
      setIsLoading(false);
    }
  };

  const canSendDocuments = uploadedFiles.some(doc => doc.isComplete && !doc.isSent);

  return {
    sendSingleDocument,
    sendDocuments,
    canSendDocuments
  };
};