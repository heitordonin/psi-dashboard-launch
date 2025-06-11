
import { useState } from "react";
import { CheckCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const handleMarkAsPaid = () => {
    if (payment.status === 'paid') return;
    setIsMarkingAsPaid(true);
    markAsPaidMutation.mutate();
    setIsMarkingAsPaid(false);
  };

  return (
    <div className="flex flex-col gap-3 lg:items-end">
      <div className="flex items-center gap-2">
        <Button
          variant={payment.status === 'paid' ? 'default' : 'outline'}
          size="sm"
          onClick={handleMarkAsPaid}
          disabled={isMarkingAsPaid || payment.status === 'paid'}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          {payment.status === 'paid' ? 'Pago' : 'Marcar como Pago'}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <PaymentStatusBadge status={payment.status} />
        <div className="flex gap-2">
          {/* Email reminder button */}
          <EmailReminderButton payment={payment} />
          
          {/* WhatsApp reminder button */}
          <WhatsAppButton payment={payment} />
          
          {/* Direct action buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(payment)}
              disabled={payment.has_payment_link === true}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete(payment.id)}
              disabled={payment.status === 'paid'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
