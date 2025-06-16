
import { Badge } from "@/components/ui/badge";

interface PaymentStatusBadgeProps {
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'overdue';
}

const statusConfig = {
  draft: {
    label: 'Rascunho',
    className: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  pending: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  paid: {
    label: 'Pago',
    className: 'bg-green-100 text-green-800 border-green-300'
  },
  failed: {
    label: 'Falhou',
    className: 'bg-red-100 text-red-800 border-red-300'
  },
  overdue: {
    label: 'Vencida',
    className: 'bg-red-100 text-red-800 border-red-300'
  }
};

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
