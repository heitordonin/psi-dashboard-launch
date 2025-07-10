import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { DraftDocument } from "@/types/draftDocument";

export const useAdminDraftQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-draft-documents'],
    queryFn: async (): Promise<DraftDocument[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('admin_documents')
        .select('*')
        .eq('status', 'draft')
        .eq('created_by_admin_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database records to DraftDocument format
      const drafts: DraftDocument[] = await Promise.all(
        data.map(async (doc) => {
          // Get signed URL for the file
          const { data: urlData } = await supabase.storage
            .from('admin-documents')
            .createSignedUrl(doc.file_path, 3600);

          return {
            id: doc.id,
            fileName: doc.title.replace('DARF Carnê-Leão - ', ''),
            fileUrl: urlData?.signedUrl || '',
            user_id: doc.user_id,
            competency: doc.competency,
            due_date: doc.due_date,
            amount: doc.amount,
            observations: '', // Campo não salvo no banco ainda
            isComplete: !!(
              doc.user_id && 
              doc.competency && 
              doc.due_date && 
              doc.amount && 
              doc.amount > 0
            ),
            isProcessingOCR: false
          };
        })
      );

      return drafts;
    },
    enabled: !!user?.id
  });
};