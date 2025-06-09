
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { EmailReminderButton } from "./EmailReminderButton";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { PaymentWithPatient } from "@/types/payment";

interface PaymentButtonsProps {
  payment: PaymentWithPatient;
  onEdit: (payment: any) => void;
  onDelete: (paymentId: string) => void;
}

export const PaymentButtons = ({ payment, onEdit, onDelete }: PaymentButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
      <PaymentStatusBadge status={payment.status} />
      <div className="flex gap-2">
        {/* WhatsApp button - mantido inativo conforme solicitado */}
        {/* <WhatsAppButton payment={payment} disabled={true} /> */}
        
        {/* Novo botão de lembrete por email */}
        <EmailReminderButton payment={payment} />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(payment)}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(payment.id)}
          className="h-8 w-8 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
