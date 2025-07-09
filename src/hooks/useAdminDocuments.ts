import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { AdminDocument, MarkAsPaidData } from "@/types/adminDocument";
import { toast } from "sonner";

export const useAdminDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['admin-documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('admin_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('hidden_from_user', false)
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return data as AdminDocument[];
    },
    enabled: !!user?.id
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ documentId, paymentData }: { documentId: string; paymentData: MarkAsPaidData }) => {
      // Update document status and payment info
      const { data: document, error: updateError } = await supabase
        .from('admin_documents')
        .update({
          status: 'paid',
          paid_date: paymentData.paid_date,
          penalty_amount: paymentData.penalty_amount,
          marked_as_paid_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Find DARF Carnê-Leão category
      const { data: category, error: categoryError } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('code', 'P20.01.00004')
        .single();

      if (categoryError) throw categoryError;

      // Create expense entry
      const totalAmount = Number(document.amount) + Number(paymentData.penalty_amount);
      
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          owner_id: user?.id,
          category_id: category.id,
          description: `${document.title} - ${document.competency}`,
          amount: totalAmount,
          payment_date: paymentData.paid_date,
          competency: document.competency,
          is_residential: true,
          residential_adjusted_amount: totalAmount,
          penalty_interest: paymentData.penalty_amount
        });

      if (expenseError) throw expenseError;

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      toast.success('Documento marcado como pago e despesa criada!');
    },
    onError: (error) => {
      console.error('Error marking document as paid:', error);
      toast.error('Erro ao marcar documento como pago');
    }
  });

  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('admin-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documents,
    isLoading,
    markAsPaid: markAsPaidMutation.mutate,
    isMarkingAsPaid: markAsPaidMutation.isPending,
    getDocumentUrl
  };
};