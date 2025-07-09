import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
  patients?: {
    full_name: string;
  };
}

interface AdminPaymentsTabProps {
  payments: Payment[];
  showAllUsers: boolean;
}

export const AdminPaymentsTab = ({ payments, showAllUsers }: AdminPaymentsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Últimas Cobranças
          {!showAllUsers && ' (Filtrado)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Paciente</th>
                <th className="text-left p-2">Valor</th>
                <th className="text-left p-2">Vencimento</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 10).map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="p-2">{payment.patients?.full_name}</td>
                  <td className="p-2">
                    {payment.amount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="p-2">
                    {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-2">
                    <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                      {payment.status === 'paid' ? 'Pago' : 
                       payment.status === 'pending' ? 'Pendente' : 
                       payment.status}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};