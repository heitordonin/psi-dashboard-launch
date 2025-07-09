import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadedDocument } from "@/types/adminDocument";

export const useAdminDocumentOCR = (
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedDocument[]>>
) => {
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

  return { processDocumentOCR };
};