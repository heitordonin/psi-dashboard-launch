import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, FileText } from 'lucide-react';

interface AdminStatsCardsProps {
  stats: {
    totalPatients: number;
    totalPayments: number;
    totalRevenue: number;
    totalExpenseAmount: number;
  } | undefined;
  showAllUsers: boolean;
}

export const AdminStatsCards = ({ stats, showAllUsers }: AdminStatsCardsProps) => {
  const filterLabel = showAllUsers ? 'Todos os usuários' : 'Usuário filtrado';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
          <p className="text-xs text-muted-foreground">{filterLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Cobranças</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalPayments || 0}</div>
          <p className="text-xs text-muted-foreground">{filterLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(stats?.totalRevenue || 0).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
          <p className="text-xs text-muted-foreground">{filterLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(stats?.totalExpenseAmount || 0).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
          <p className="text-xs text-muted-foreground">{filterLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
};