
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PaymentWithPatient } from "@/types/payment";

interface EmailReminderButtonProps {
  payment: PaymentWithPatient;
  disabled?: boolean;
}

export const EmailReminderButton = ({ payment, disabled }: EmailReminderButtonProps) => {
  const [sending, setSending] = useState(false);

  const handleSendReminder = async () => {
    if (!payment.patients || !payment.patients.full_name) {
      toast.error('Paciente não encontrado');
      return;
    }

    // Para MVP, vamos assumir que o email está no campo email do paciente
    // Isso pode ser expandido futuramente para incluir email do responsável financeiro
    const recipientEmail = payment.patients.email;
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Email do paciente não encontrado ou inválido');
      return;
    }

    setSending(true);
    try {
      // Chamar edge function para enviar email
      const { error } = await supabase.functions.invoke('send-email-reminder', {
        body: {
          paymentId: payment.id,
          recipientEmail: recipientEmail,
          amount: payment.amount,
          patientName: payment.patients.full_name,
          dueDate: payment.due_date,
          description: payment.description
        }
      });

      if (error) {
        console.error('Error sending email reminder:', error);
        toast.error('Erro ao enviar lembrete por email');
      } else {
        // Atualizar o timestamp de envio do lembrete
        await supabase
          .from('payments')
          .update({ email_reminder_sent_at: new Date().toISOString() })
          .eq('id', payment.id);

        toast.success('Lembrete enviado por email com sucesso!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao enviar lembrete por email');
    } finally {
      setSending(false);
    }
  };

  // Não mostrar o botão se o pagamento não está pendente
  if (payment.status !== 'pending' || payment.paid_date) {
    return null;
  }

  // Verificar se o paciente tem email válido
  if (!payment.patients?.email || !payment.patients.email.includes('@')) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSendReminder}
      disabled={disabled || sending}
      className="flex items-center gap-2"
    >
      {sending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
      {sending ? 'Enviando...' : 'Lembrete Email'}
    </Button>
  );
};
