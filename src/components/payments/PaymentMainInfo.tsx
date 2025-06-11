
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Calendar, User, FileText, CreditCard } from "lucide-react";
import type { PaymentWithPatient } from "@/types/payment";

interface PaymentMainInfoProps {
  payment: PaymentWithPatient;
}

export function PaymentMainInfo({ payment }: PaymentMainInfoProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900">
            {payment.patients?.full_name || 'Paciente não encontrado'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-green-600">
            {formatCurrency(Number(payment.amount))}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>Vencimento: {formatDate(payment.due_date)}</span>
        </div>

        {payment.paid_date && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Pago em: {formatDate(payment.paid_date)}</span>
          </div>
        )}

        {payment.description && (
          <div className="flex items-center gap-2 md:col-span-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 truncate">{payment.description}</span>
          </div>
        )}
      </div>

      {payment.payment_url && (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <a 
            href={payment.payment_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            Link de pagamento
          </a>
        </div>
      )}
    </div>
  );
}
