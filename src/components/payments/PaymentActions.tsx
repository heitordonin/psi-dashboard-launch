import { useState } from "react";
import { CheckCircle, Pencil, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { EmailReminderButton } from "./EmailReminderButton";
import { WhatsAppButton } from "./WhatsAppButton";
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

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', payment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pagamento marcado como pago!');
    },
    onError: (error) => {
      console.error('Error marking payment as paid:', error);
      toast.error('Erro ao marcar pagamento como pago');
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
    setIsMarkingAsPaid(true);
    markAsPaidMutation.mutate();
    setIsMarkingAsPaid(false);
  };

  const handleMarkAsUnpaid = () => {
    markAsUnpaidMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-3 lg:items-end">
      <div className="flex items-center gap-2">
        {/* Only show "Mark as Paid" button for pending manual charges */}
        {payment.status !== 'paid' && !payment.has_payment_link && (
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

        {payment.status === 'paid' && !payment.has_payment_link && (
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
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <PaymentStatusBadge status={payment.status} />
          {payment.has_payment_link && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
              Com link de cobrança
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {/* Email reminder button */}
          <EmailReminderButton payment={payment} />
          
          {/* WhatsApp reminder button */}
          <WhatsAppButton payment={payment} />
          
          {/* Direct action buttons */}
          <div className="flex items-center gap-1">
            {/* Edit button with tooltip when disabled */}
            {payment.has_payment_link ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button variant="ghost" size="icon" disabled={true}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Não é possível editar uma cobrança com link de pagamento.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(payment)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            
            {/* Delete button with tooltip when disabled */}
            {payment.status === 'paid' ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button variant="ghost" size="icon" className="text-red-600" disabled={true}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Não é possível excluir uma cobrança já recebida.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(payment.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
