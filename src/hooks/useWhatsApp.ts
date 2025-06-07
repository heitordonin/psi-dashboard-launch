
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhatsAppMessage {
  to: string;
  message: string;
  paymentId?: string;
  messageType?: string;
}

export const useWhatsApp = () => {
  const sendWhatsApp = useMutation({
    mutationFn: async ({ to, message, paymentId, messageType }: WhatsAppMessage) => {
      console.log('Sending WhatsApp message:', { to, message, paymentId, messageType });
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { to, message, paymentId, messageType }
      });

      if (error) {
        console.error('Error sending WhatsApp:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Mensagem WhatsApp enviada com sucesso!');
    },
    onError: (error: any) => {
      console.error('WhatsApp send error:', error);
      toast.error('Erro ao enviar mensagem WhatsApp');
    }
  });

  return {
    sendWhatsApp: sendWhatsApp.mutate,
    isLoading: sendWhatsApp.isPending,
    error: sendWhatsApp.error
  };
};
