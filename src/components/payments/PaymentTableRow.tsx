import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Calendar, MoreVertical, User, Clock } from "lucide-react";
import { createSafeDateFromString, getTodayLocalDate } from "@/utils/dateUtils";
import { PaymentActions } from "./PaymentActions";
import { cn } from "@/lib/utils";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentTableRowProps {
  payment: PaymentWithPatient;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
}

export function PaymentTableRow({ payment, onEdit, onDelete }: PaymentTableRowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return createSafeDateFromString(dateString).toLocaleDateString('pt-BR');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Check if payment is overdue and not paid
  const isOverdue = !payment.paid_date && createSafeDateFromString(payment.due_date) < getTodayLocalDate();
  
  // Status badge
  const getStatusBadge = () => {
    if (payment.paid_date) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </span>
      );
    }
    
    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
          <Clock className="w-3 h-3 mr-1" />
          Vencida
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
        <Calendar className="w-3 h-3 mr-1" />
        Pendente
      </span>
    );
  };

  return (
    <tr 
      className={cn(
        "hover:bg-gray-50 transition-colors",
        payment.receita_saude_receipt_issued && "bg-green-50"
      )}
    >
      {/* Paciente */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            {payment.patients?.full_name || 'Sem paciente'}
          </span>
        </div>
      </td>

      {/* Descrição */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-600" title={payment.description || ''}>
          {payment.description ? truncateText(payment.description, 8) : '-'}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge()}
      </td>

      {/* Valor */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(Number(payment.amount))}
        </span>
      </td>

      {/* Vencimento */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={cn(
          "text-sm",
          isOverdue ? "text-red-600 font-medium" : "text-gray-600"
        )}>
          {formatDate(payment.due_date)}
        </span>
      </td>

      {/* Data de Pagamento */}
      <td className="px-6 py-4 whitespace-nowrap">
        {payment.paid_date ? (
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-gray-600">
              {formatDate(payment.paid_date)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>

      {/* Ações */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <PaymentActions 
          payment={payment}
          onEdit={onEdit}
          onDelete={onDelete}
          layout="compact"
        />
      </td>
    </tr>
  );
}