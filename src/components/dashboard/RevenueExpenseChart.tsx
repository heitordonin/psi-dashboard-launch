
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";

interface RevenueExpenseChartProps {
  revenue: number;
  expense: number;
}

export function RevenueExpenseChart({ revenue, expense }: RevenueExpenseChartProps) {
  const data = [
    {
      name: "Receita",
      value: revenue,
      fill: "#002471"
    },
    {
      name: "Despesa", 
      value: expense,
      fill: "#03f6f9"
    }
  ];

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-psiclo-primary">
          Receita x Despesa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                label={{
                  position: 'top',
                  formatter: formatCurrency,
                  fontSize: 12,
                  fill: "#374151"
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
