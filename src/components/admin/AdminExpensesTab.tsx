import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Expense {
  id: string;
  amount: number;
  payment_date: string;
  penalty_interest: number;
  residential_adjusted_amount: number | null;
  description: string | null;
  created_at: string;
  expense_categories?: {
    name: string;
  };
}

interface AdminExpensesTabProps {
  expenses: Expense[];
  showAllUsers: boolean;
}

export const AdminExpensesTab = ({ expenses, showAllUsers }: AdminExpensesTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Últimas Despesas
          {!showAllUsers && ' (Filtrado)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Categoria</th>
                <th className="text-left p-2">Valor</th>
                <th className="text-left p-2">Valor Ajustado Residencial</th>
                <th className="text-left p-2">Juros/Multa</th>
                <th className="text-left p-2">Data Pagamento</th>
                <th className="text-left p-2">Descrição</th>
                <th className="text-left p-2">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 10).map((expense) => (
                <tr key={expense.id} className="border-b">
                  <td className="p-2">{expense.expense_categories?.name}</td>
                  <td className="p-2">
                    {expense.amount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="p-2">
                    {expense.residential_adjusted_amount ? 
                      expense.residential_adjusted_amount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }) : '-'
                    }
                  </td>
                  <td className="p-2">
                    {expense.penalty_interest.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="p-2">
                    {new Date(expense.payment_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-2">{expense.description || '-'}</td>
                  <td className="p-2">
                    {new Date(expense.created_at).toLocaleDateString('pt-BR')}
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