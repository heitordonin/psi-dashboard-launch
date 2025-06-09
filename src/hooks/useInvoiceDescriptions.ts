
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface InvoiceDescription {
  id: string;
  subject?: string;
  text: string;
  created_at: string;
}

export const useInvoiceDescriptions = (isOpen: boolean) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: descriptions = [], isLoading } = useQuery({
    queryKey: ['invoice-descriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('invoice_descriptions')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InvoiceDescription[];
    },
    enabled: isOpen && !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data: { subject?: string; text: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('invoice_descriptions')
        .insert({
          ...data,
          owner_id: user.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-descriptions', user?.id] });
      toast.success('Descrição criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar descrição: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; subject?: string; text: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('invoice_descriptions')
        .update(updateData)
        .eq('id', id)
        .eq('owner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-descriptions', user?.id] });
      toast.success('Descrição atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar descrição: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('invoice_descriptions')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-descriptions', user?.id] });
      toast.success('Descrição excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir descrição: ' + error.message);
    }
  });

  return {
    descriptions,
    isLoading,
    createMutation,
    updateMutation,
    deleteMutation
  };
};

export type { InvoiceDescription };
