
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserX } from "lucide-react";

interface AdminKPICardsProps {
  userKpis?: {
    total_users: number;
    new_users_last_30_days: number;
    inactive_users: number;
  } | null;
  userKpisByPlan?: {
    total_users_free: number;
    total_users_gestao: number; 
    total_users_psi_regular: number;
    new_users_free_30_days: number;
    new_users_gestao_30_days: number;
    new_users_psi_regular_30_days: number;
  } | null;
}

export const AdminKPICards = ({ userKpis, userKpisByPlan }: AdminKPICardsProps) => {
  return (
    <div className="space-y-6">
      {/* KPIs Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userKpis?.total_users || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Usuários (30 dias)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userKpis?.new_users_last_30_days || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userKpis?.inactive_users || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs por Plano */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Grátis</CardTitle>
            <div className="w-3 h-3 rounded-full bg-success"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{userKpisByPlan?.total_users_free || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{userKpisByPlan?.new_users_free_30_days || 0} últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Gestão</CardTitle>
            <div className="w-3 h-3 rounded-full bg-primary"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userKpisByPlan?.total_users_gestao || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{userKpisByPlan?.new_users_gestao_30_days || 0} últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Psi Regular</CardTitle>
            <div className="w-3 h-3 rounded-full bg-warning"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{userKpisByPlan?.total_users_psi_regular || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{userKpisByPlan?.new_users_psi_regular_30_days || 0} últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
