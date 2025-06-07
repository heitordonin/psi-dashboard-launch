
import { Receipt } from "lucide-react";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import type { Payment } from "@/types/payment";

interface PaymentWithPatient extends Payment {
  patients?: {
    full_name: string;
    cpf?: string;
  };
}

interface PaymentItemProps {
  payment: PaymentWithPatient;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
}

export const PaymentItem = ({ payment, onEdit, onDelete }: PaymentItemProps) => {
  return (
    <div className="flex justify-between items-start p-4 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">
          {payment.patients?.full_name || 'Paciente não encontrado'}
        </p>
        {payment.description && (
          <p className="text-xs text-gray-600 truncate mt-1">{payment.description}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
        </p>
        {payment.paid_date && (
          <p className="text-xs text-green-600 mt-1">
            Pago em: {new Date(payment.paid_date).toLocaleDateString('pt-BR')}
          </p>
        )}
        {payment.status === 'paid' && (
          <div className="flex items-center gap-1 mt-1">
            <Receipt className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-blue-600">
              {payment.receita_saude_receipt_issued ? 'Recibo emitido' : 'Recibo pendente'}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 ml-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <PaymentStatusBadge status={payment.status} />
        </div>
        <ActionDropdown
          onEdit={() => onEdit(payment)}
          onDelete={() => onDelete(payment)}
        />
      </div>
    </div>
  );
};
