import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryData {
  receivedCount: number;
  receivedTotal: number;
  pendingCount: number;
  pendingTotal: number;
  overdueCount: number;
  overdueTotal: number;
  expenseCount: number;
  expenseTotal: number;
  // These metrics are no longer used but keep them optional for backward-compat
  confirmedCount?: number;
  confirmedTotal?: number;
}

interface SummaryCardProps {
  data: SummaryData;
  isLoading: boolean;
}

export function SummaryCard({ data, isLoading }: SummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const metrics = [
    {
      label: "Recebidas",
      count: data.receivedCount,
      total: data.receivedTotal,
      color: "text-green-600"
    },
    {
      label: "Aguardando pag.",
      count: data.pendingCount,
      total: data.pendingTotal,
      color: "text-orange-600"
    },
    {
      label: "Vencidas",
      count: data.overdueCount,
      total: data.overdueTotal,
      color: "text-red-600"
    },
    {
      label: "Despesas",
      count: data.expenseCount,
      total: data.expenseTotal,
      color: "text-purple-600"
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumo das transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo das transações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
            <div>Métrica</div>
            <div className="text-center">Quantidade</div>
            <div className="text-center">Valor (R$)</div>
          </div>
          
          {metrics.map((metric, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 items-center py-2">
              <div className="font-medium">{metric.label}</div>
              <div className="text-center">{metric.count}</div>
              <div className={`text-center font-medium ${metric.color}`}>
                {formatCurrency(metric.total)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
