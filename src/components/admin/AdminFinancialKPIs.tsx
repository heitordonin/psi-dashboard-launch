import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

interface AdminFinancialKPIsProps {
  mrrMetrics?: {
    total_mrr: number;
    mrr_free: number;
    mrr_gestao: number;
    mrr_psi_regular: number;
    mrr_growth_rate: number;
  };
  ltvMetrics?: {
    avg_ltv_gestao: number;
    avg_ltv_psi_regular: number;
    avg_subscription_duration_days: number;
  };
}

export const AdminFinancialKPIs = ({ mrrMetrics, ltvMetrics }: AdminFinancialKPIsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDays = (days: number) => {
    return `${Math.round(days)} dias`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(mrrMetrics?.total_mrr || 0)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {mrrMetrics?.mrr_growth_rate ? (
              mrrMetrics.mrr_growth_rate > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  +{mrrMetrics.mrr_growth_rate}%
                </>
              ) : (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  {mrrMetrics.mrr_growth_rate}%
                </>
              )
            ) : (
              "No anterior"
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARR Projetado</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency((mrrMetrics?.total_mrr || 0) * 12)}
          </div>
          <p className="text-xs text-muted-foreground">
            Receita recorrente anual
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">LTV Médio Gestão</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(ltvMetrics?.avg_ltv_gestao || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor vitalício do cliente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">LTV Médio Psi Regular</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(ltvMetrics?.avg_ltv_psi_regular || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor vitalício do cliente
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Distribuição MRR por Plano</CardTitle>
          <CardDescription>Receita mensal recorrente segmentada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Free:</span>
              <span className="font-medium text-muted-foreground">{formatCurrency(mrrMetrics?.mrr_free || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Gestão:</span>
              <span className="font-medium">{formatCurrency(mrrMetrics?.mrr_gestao || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Psi Regular:</span>
              <span className="font-medium">{formatCurrency(mrrMetrics?.mrr_psi_regular || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Duração Média da Assinatura</CardTitle>
          <CardDescription>Tempo médio de permanência</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-center">
            {formatDays(ltvMetrics?.avg_subscription_duration_days || 0)}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Duração média entre todos os planos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};