import { useEffect } from "react";
import { UploadedDocument } from "@/types/adminDocument";

export const useAdminDocumentStorage = (
  uploadedFiles: UploadedDocument[],
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedDocument[]>>
) => {
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
  }, [setUploadedFiles]);

  // Save documents to localStorage whenever uploadedFiles changes
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem('admin_uploaded_documents', JSON.stringify(uploadedFiles));
    } else {
      localStorage.removeItem('admin_uploaded_documents');
    }
  }, [uploadedFiles]);
};