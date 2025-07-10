import { supabase } from "@/integrations/supabase/client";

export const sendDocumentNotificationEmail = async (documentId: string, documentData: any): Promise<boolean> => {
  try {
    const { error: emailError } = await supabase.functions
      .invoke('send-document-notification', {
        body: {
          user_id: documentData.user_id,
          document_id: documentId,
          title: documentData.title,
          amount: documentData.amount,
          due_date: documentData.due_date,
          competency: documentData.competency
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