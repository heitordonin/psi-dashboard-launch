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

  const uploadFiles = async (files: File[]) => {
    if (!user?.id) return;

    setIsLoading(true);
    const newDocuments: UploadedDocument[] = [];

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
          isSent: false
        };

        newDocuments.push(document);
      }

      setUploadedFiles(prev => [...prev, ...newDocuments]);
      toast.success(`${newDocuments.length} arquivo(s) carregado(s) com sucesso!`);

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
      const { error } = await supabase
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
        });

      if (error) throw error;

      // Remove document from local list after successful send
      setUploadedFiles(prev => {
        const filtered = prev.filter(doc => doc.id !== documentId);
        if (filtered.length === 0) {
          localStorage.removeItem('admin_uploaded_documents');
        }
        return filtered;
      });

      toast.success("Documento enviado com sucesso!");

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
    try {
      for (const doc of completeDocuments) {
        // Create document record in database
        const { error } = await supabase
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
          });

        if (error) throw error;
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

      toast.success(`${completeDocuments.length} documento(s) enviado(s) com sucesso!`);

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
    canSendDocuments
  };
};