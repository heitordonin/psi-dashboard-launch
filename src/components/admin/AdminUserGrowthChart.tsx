
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface AdminUserGrowthChartProps {
  userGrowthByPlan?: Array<{ 
    date: string; 
    free_count: number; 
    gestao_count: number; 
    psi_regular_count: number; 
  }>;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const AdminUserGrowthChart = ({ 
  userGrowthByPlan, 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: AdminUserGrowthChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crescimento de Usuários por Plano</CardTitle>
        <div className="flex gap-4 mt-4">
          <div>
            <Label htmlFor="start-date">Data Inicial</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">Data Final</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userGrowthByPlan}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), 'dd/MM')}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy')}
            />
            <Legend />
            <Bar 
              dataKey="free_count" 
              stackId="stack" 
              fill="hsl(var(--muted-chart))" 
              name="Grátis"
            />
            <Bar 
              dataKey="gestao_count" 
              stackId="stack" 
              fill="hsl(var(--primary))" 
              name="Gestão"
            />
            <Bar 
              dataKey="psi_regular_count" 
              stackId="stack" 
              fill="hsl(var(--success))" 
              name="Psi Regular"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
