
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWhatsAppLimit } from "./useWhatsAppLimit";

interface WhatsAppMessage {
  to: string;
  message?: string;
  templateSid?: string;
  templateVariables?: { [key: string]: string }; // CORREÇÃO: objeto em vez de array
  paymentId?: string;
  messageType?: string;
}

export const useWhatsApp = () => {
  const queryClient = useQueryClient();
  const { canSend, messagesRemaining, hasWhatsAppAccess, planSlug } = useWhatsAppLimit();

  const sendWhatsApp = useMutation({
    mutationFn: async ({ to, message, templateSid, templateVariables, paymentId, messageType }: WhatsAppMessage) => {
      console.log('Sending WhatsApp message:', { to, message, templateSid, templateVariables, paymentId, messageType });
      
      // Verificar se tem acesso ao WhatsApp
      if (!hasWhatsAppAccess) {
        throw new Error('Seu plano atual não inclui acesso ao WhatsApp. Faça upgrade para ter acesso a esta funcionalidade.');
      }

      // Verificar limite para plano Gestão
      if (planSlug === 'gestao' && !canSend) {
        throw new Error(`Limite de mensagens WhatsApp atingido. Você pode enviar até 100 mensagens por mês. Restam: ${messagesRemaining} mensagens.`);
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { to, message, templateSid, templateVariables, paymentId, messageType }
      });

      if (error) {
        console.error('Error sending WhatsApp:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar a query do contador de mensagens para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ['monthly-whatsapp-count'] });
      toast.success('Mensagem WhatsApp enviada com sucesso!');
    },
    onError: (error: any) => {
      console.error('WhatsApp send error:', error);
      const errorMessage = error.message || 'Erro ao enviar mensagem WhatsApp';
      toast.error(errorMessage);
    }
  });

  return {
    sendWhatsApp: sendWhatsApp.mutate,
    isLoading: sendWhatsApp.isPending,
    error: sendWhatsApp.error,
    canSend,
    messagesRemaining,
    hasWhatsAppAccess
  };
};
