import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserMinus, Shield, Percent } from "lucide-react";

interface AdminChurnMetricsProps {
  churnMetrics?: {
    monthly_churn_rate: number;
    total_cancellations_30_days: number;
    retention_rate: number;
    active_subscribers: number;
  };
  conversionMetrics?: {
    free_to_paid_rate: number;
    gestao_to_psi_regular_rate: number;
    total_conversions_30_days: number;
  };
}

export const AdminChurnMetrics = ({ churnMetrics, conversionMetrics }: AdminChurnMetricsProps) => {
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Churn Mensal</CardTitle>
          <UserMinus className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatPercentage(churnMetrics?.monthly_churn_rate || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Cancelamentos nos últimos 30 dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
          <Shield className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatPercentage(churnMetrics?.retention_rate || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Usuários retidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {churnMetrics?.active_subscribers?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Base total de assinantes pagos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cancelamentos (30d)</CardTitle>
          <UserMinus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {churnMetrics?.total_cancellations_30_days?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Total de cancelamentos
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Taxa de Conversão Free → Pago</CardTitle>
          <CardDescription>Conversão de usuários gratuitos para planos pagos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-center text-green-600">
            {formatPercentage(conversionMetrics?.free_to_paid_rate || 0)}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {conversionMetrics?.total_conversions_30_days || 0} conversões nos últimos 30 dias
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Taxa de Upgrade Gestão → Psi Regular</CardTitle>
          <CardDescription>Upgrade entre planos pagos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-center text-blue-600">
            {formatPercentage(conversionMetrics?.gestao_to_psi_regular_rate || 0)}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Taxa de upgrade para o plano premium
          </p>
        </CardContent>
      </Card>
    </div>
  );
};