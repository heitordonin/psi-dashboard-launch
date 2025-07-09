import { useState } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { UploadedDocument } from "@/types/adminDocument";
import { useAdminDocumentStorage } from "./useAdminDocumentStorage";
import { useAdminDocumentUsers } from "./useAdminDocumentUsers";
import { useAdminDocumentOCR } from "./useAdminDocumentOCR";
import { useAdminDocumentUploadActions } from "./useAdminDocumentUploadActions";
import { useAdminDocumentSender } from "./useAdminDocumentSender";

export const useAdminDocumentUpload = () => {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use modular hooks
  useAdminDocumentStorage(uploadedFiles, setUploadedFiles);
  const { users } = useAdminDocumentUsers();
  const { processDocumentOCR } = useAdminDocumentOCR(setUploadedFiles);
  const { uploadFiles, updateDocument, deleteDocument } = useAdminDocumentUploadActions(
    uploadedFiles,
    setUploadedFiles,
    setIsLoading,
    user?.id
  );
  const { sendSingleDocument, sendDocuments, canSendDocuments } = useAdminDocumentSender(
    uploadedFiles,
    setUploadedFiles,
    setIsLoading,
    user?.id
  );

  // Wrapper for uploadFiles to include OCR processing
  const handleUploadFiles = async (files: File[]) => {
    await uploadFiles(files, processDocumentOCR);
  };

  return {
    uploadedFiles,
    users,
    isLoading,
    uploadFiles: handleUploadFiles,
    updateDocument,
    deleteDocument,
    sendDocuments,
    sendSingleDocument,
    canSendDocuments,
    processDocumentOCR
  };
};