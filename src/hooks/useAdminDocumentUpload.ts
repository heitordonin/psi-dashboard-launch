import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "sonner";

interface UploadedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  user_id?: string;
  competency?: string;
  due_date?: string;
  amount?: number;
  observations?: string;
  isComplete: boolean;
  isSent?: boolean;
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

interface User {
  id: string;
  full_name?: string;
  display_name?: string;
}

export const useAdminDocumentUpload = () => {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocuments = localStorage.getItem('admin_uploaded_documents');
    if (savedDocuments) {
      try {
        const parsedDocuments = JSON.parse(savedDocuments);
        setUploadedFiles(parsedDocuments);
      } catch (error) {
        console.error("Error loading saved documents:", error);
      }
    }
  }, []);

  // Save documents to localStorage whenever uploadedFiles changes
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem('admin_uploaded_documents', JSON.stringify(uploadedFiles));
    } else {
      localStorage.removeItem('admin_uploaded_documents');
    }
  }, [uploadedFiles]);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erro ao carregar usuários");
    }
  };

  const processDocumentOCR = async (documentId: string, file: File) => {
    try {
      // Mark document as processing OCR
      setUploadedFiles(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, isProcessingOCR: true }
            : doc
        )
      );

      // Create form data for OCR API
      const formData = new FormData();
      formData.append('file', file);

      // Call OCR edge function
      const { data: ocrData, error: ocrError } = await supabase.functions
        .invoke('extract-darf-data', {
          body: formData,
        });

      if (ocrError) throw ocrError;

      // Find user by CPF if extracted
      let foundUserId: string | undefined;
      if (ocrData.cpf) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('cpf', ocrData.cpf)
          .single();
        
        if (!userError && userData) {
          foundUserId = userData.id;
          toast.success(`Usuário encontrado automaticamente: ${userData.full_name}`);
        }
      }

      // Update document with OCR results
      setUploadedFiles(prev => 
        prev.map(doc => {
          if (doc.id === documentId) {
            const updated = {
              ...doc,
              isProcessingOCR: false,
              ocrExtracted: ocrData,
              user_id: foundUserId || doc.user_id,
              competency: ocrData.competency || doc.competency,
              due_date: ocrData.due_date || doc.due_date,
              amount: ocrData.amount || doc.amount,
            };
            
            // Check if document is complete after OCR
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

      const extractedCount = Object.values(ocrData.confidence || {}).filter((c): c is number => typeof c === 'number' && c > 0).length;
      if (extractedCount > 0) {
        toast.success(`OCR processado! ${extractedCount} campo(s) extraído(s) automaticamente.`);
      } else {
        toast.info("OCR processado, mas nenhum campo foi reconhecido. Preencha manualmente.");
      }

    } catch (error) {
      console.error("Error processing OCR:", error);
      setUploadedFiles(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, isProcessingOCR: false }
            : doc
        )
      );
      toast.error("Erro ao processar OCR. Preencha os dados manualmente.");
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!user?.id) return;

    setIsLoading(true);
    const newDocuments: UploadedDocument[] = [];
    const uploadedFiles: { doc: UploadedDocument, file: File }[] = [];

    try {
      for (const file of files) {
        // Validate file type
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} não é um arquivo PDF válido`);
          continue;
        }

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
        uploadedFiles.push({ doc: document, file });
      }

      setUploadedFiles(prev => [...prev, ...newDocuments]);
      toast.success(`${newDocuments.length} arquivo(s) carregado(s) com sucesso!`);

      // Process OCR for each uploaded file
      for (const { doc, file } of uploadedFiles) {
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

  const sendSingleDocument = async (documentId: string) => {
    if (!user?.id) return;

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
          file_path: `${user.id}/${document.id}_${document.fileName}`,
          created_by_admin_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification email
      try {
        const { error: emailError } = await supabase.functions
          .invoke('send-document-notification', {
            body: {
              user_id: document.user_id,
              document_id: insertedDocument.id,
              title: `DARF Carnê-Leão - ${document.fileName}`,
              amount: document.amount,
              due_date: document.due_date,
              competency: document.competency
            }
          });

        if (emailError) {
          console.error("Error sending notification email:", emailError);
          toast.warning("Documento enviado, mas houve erro ao enviar notificação por email");
        } else {
          toast.success("Documento enviado e usuário notificado por email!");
        }
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
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
    if (!user?.id) return;

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
            file_path: `${user.id}/${doc.id}_${doc.fileName}`,
            created_by_admin_id: user.id
          })
          .select()
          .single();

        if (error) throw error;
        
        successCount++;

        // Send notification email for each document
        try {
          const { error: emailError } = await supabase.functions
            .invoke('send-document-notification', {
              body: {
                user_id: doc.user_id,
                document_id: insertedDocument.id,
                title: `DARF Carnê-Leão - ${doc.fileName}`,
                amount: doc.amount,
                due_date: doc.due_date,
                competency: doc.competency
              }
            });

          if (!emailError) {
            emailSuccessCount++;
          } else {
            console.error("Error sending notification email for document:", doc.fileName, emailError);
          }
        } catch (emailError) {
          console.error("Error sending notification email for document:", doc.fileName, emailError);
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
    uploadedFiles,
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