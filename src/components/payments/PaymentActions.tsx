
import { useState } from "react";
import { CheckCircle, Pencil, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { PaymentLinkButton } from "./PaymentLinkButton";
import { EmailReminderButton } from "./EmailReminderButton";
import { WhatsAppButton } from "./WhatsAppButton";
import { PaymentDateModal } from "./PaymentDateModal";
import { toast } from "sonner";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentActionsProps {
  payment: PaymentWithPatient;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
}

export function PaymentActions({ payment, onEdit, onDelete }: PaymentActionsProps) {
  const queryClient = useQueryClient();
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Calculate display status for overdue payments
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to the beginning of the day

  const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < today;
  const displayStatus = isOverdue ? 'overdue' : payment.status;

  // Check if payment is blocked due to receita saude receipt
  const isBlockedByReceitaSaude = payment.receita_saude_receipt_issued;

  const markAsPaidMutation = useMutation({
    mutationFn: async (paidDate: string) => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_date: paidDate
        })
        .eq('id', payment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pagamento marcado como pago!');
      setIsMarkingAsPaid(false);
      setIsDateModalOpen(false);
    },
    onError: (error) => {
      console.error('Error marking payment as paid:', error);
      toast.error('Erro ao marcar pagamento como pago');
      setIsMarkingAsPaid(false);
      setIsDateModalOpen(false);
    }
  });

  const markAsUnpaidMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'pending',
          paid_date: null
        })
        .eq('id', payment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança marcada como pendente!');
    },
    onError: (error) => {
      console.error('Error marking payment as unpaid:', error);
      toast.error('Erro ao marcar cobrança como pendente');
    }
  });

  const handleMarkAsPaid = () => {
    if (payment.status === 'paid') return;
    setIsDateModalOpen(true);
  };

  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleConfirmPayment = (date: Date) => {
    setIsMarkingAsPaid(true);
    const paidDate = formatDateForDatabase(date);
    markAsPaidMutation.mutate(paidDate);
  };

  const handleMarkAsUnpaid = () => {
    markAsUnpaidMutation.mutate();
  };

  return (
    <div className="space-y-4">
      {/* Status and badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <PaymentStatusBadge status={displayStatus} />
        {payment.has_payment_link && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Com link de cobrança
          </Badge>
        )}
        {isBlockedByReceitaSaude && (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            Recibo Emitido
          </Badge>
        )}
      </div>

      {/* Main action buttons row */}
      <div className="flex flex-wrap gap-2">
        {/* Mark as Paid/Unpaid button */}
        {payment.status !== 'paid' && !payment.has_payment_link && !isBlockedByReceitaSaude && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsPaid}
            disabled={isMarkingAsPaid}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Marcar como Pago
          </Button>
        )}

        {payment.status === 'paid' && !payment.has_payment_link && !isBlockedByReceitaSaude && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsUnpaid}
            disabled={markAsUnpaidMutation.isPending}
          >
            <Undo2 className="w-4 h-4 mr-1" />
            Marcar como não pago
          </Button>
        )}

        {/* Blocked mark as unpaid button with tooltip */}
        {payment.status === 'paid' && isBlockedByReceitaSaude && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={true}
                  >
                    <Undo2 className="w-4 h-4 mr-1" />
                    Marcar como não pago
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Não é possível alterar uma cobrança com recibo emitido.</p>
                <p>Desmarque no Controle Receita Saúde para permitir alterações.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Payment link button */}
        {payment.has_payment_link && payment.status === 'pending' && (
          <PaymentLinkButton payment={payment} />
        )}
      </div>

      {/* Communication buttons row */}
      <div className="flex flex-wrap gap-2">
        <EmailReminderButton payment={payment} />
        <WhatsAppButton payment={payment} />
      </div>

      {/* Edit/Delete actions row */}
      <div className="flex gap-2">
        {/* Edit button with tooltip when disabled */}
        {(payment.has_payment_link || isBlockedByReceitaSaude) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="ghost" size="sm" disabled={true}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {payment.has_payment_link 
                    ? "Não é possível editar uma cobrança com link de pagamento."
                    : "Não é possível editar uma cobrança com recibo emitido. Desmarque no Controle Receita Saúde para permitir alterações."
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(payment)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
        )}
        
        {/* Delete button with tooltip when disabled */}
        {(payment.status === 'paid' || isBlockedByReceitaSaude) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="ghost" size="sm" className="text-red-600" disabled={true}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {payment.status === 'paid' && isBlockedByReceitaSaude
                    ? "Não é possível excluir uma cobrança paga com recibo emitido."
                    : payment.status === 'paid'
                    ? "Não é possível excluir uma cobrança já recebida."
                    : "Não é possível excluir uma cobrança com recibo emitido. Desmarque no Controle Receita Saúde para permitir alterações."
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => onDelete(payment.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        )}
      </div>

      <PaymentDateModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        onConfirm={handleConfirmPayment}
        isLoading={isMarkingAsPaid}
      />
    </div>
  );
}
