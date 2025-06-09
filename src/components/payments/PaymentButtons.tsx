
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { EmailReminderButton } from "./EmailReminderButton";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PaymentWithPatient } from "@/types/payment";

interface PaymentButtonsProps {
  payment: PaymentWithPatient;
  onEdit: (payment: any) => void;
  onDelete: (paymentId: string) => void;
}

export const PaymentButtons = ({ payment, onEdit, onDelete }: PaymentButtonsProps) => {
  const navigate = useNavigate();

  const handleReceitaSaudeClick = () => {
    navigate('/receita-saude-control');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
      <PaymentStatusBadge status={payment.status} />
      <div className="flex gap-2">
        {/* Email reminder button */}
        <EmailReminderButton payment={payment} />
        
        {/* Receita Saúde button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReceitaSaudeClick}
          className="flex items-center gap-2"
        >
          <Receipt className="h-4 w-4" />
          Receita Saúde
        </Button>
        
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
