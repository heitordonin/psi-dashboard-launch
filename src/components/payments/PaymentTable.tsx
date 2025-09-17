import { PaymentTableRow } from "./PaymentTableRow";
import { PaymentActions } from "./PaymentActions";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentTableProps {
  payments: PaymentWithPatient[];
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
}

export function PaymentTable({ payments, onEdit, onDelete }: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Nenhuma cobrança encontrada</div>
        <div className="text-gray-400 text-sm mt-2">
          Use os filtros ou crie uma nova cobrança
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map(payment => (
                <PaymentTableRow
                  key={payment.id}
                  payment={payment}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Mobile version - simplified cards */}
      <div className="sm:hidden">
        <ul className="divide-y divide-gray-200">
          {payments.map(payment => (
            <li key={payment.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {payment.patients?.full_name || 'Sem paciente'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(Number(payment.amount))}
                  </p>
                  <p className="text-xs text-gray-400">
                    Venc: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {payment.paid_date ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      Pendente
                    </span>
                  )}
                  <PaymentActions 
                    payment={payment}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    layout="compact"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}