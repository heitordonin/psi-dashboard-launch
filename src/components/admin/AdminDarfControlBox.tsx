import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format, subMonths } from "date-fns";
import { useAdminDarfControl } from "@/hooks/useAdminDarfControl";
import { AdminDarfUsersModal } from "./AdminDarfUsersModal";
import { FileText, Users } from "lucide-react";

export const AdminDarfControlBox = () => {
  const [selectedCompetency, setSelectedCompetency] = useState(
    format(subMonths(new Date(), 1), 'yyyy-MM')
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { darfStats, pendingUsers, isLoading } = useAdminDarfControl(selectedCompetency);

  // Generate last 12 months for competency selector
  const competencyOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  const pieData = [
    {
      name: 'Enviados',
      value: Number(darfStats?.users_with_darf_sent || 0) + Number(darfStats?.users_manually_completed || 0),
      color: 'hsl(var(--success))'
    },
    {
      name: 'Pendentes',
      value: Number(darfStats?.users_pending || 0),
      color: 'hsl(var(--destructive))'
    }
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Controle de Obrigações
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedCompetency} onValueChange={setSelectedCompetency}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês de vencimento" />
                </SelectTrigger>
                <SelectContent>
                  {competencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isLoading || Number(darfStats?.users_pending || 0) === 0}
            >
              <Users className="h-4 w-4" />
              Ver Pendentes ({darfStats?.users_pending || 0})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {darfStats?.users_with_darf_sent || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">DARFs Enviados</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-warning">
                    {darfStats?.users_manually_completed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Marcados Manual</div>
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {darfStats?.completion_percentage || 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Taxa de Completude
                </div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} usuários`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminDarfUsersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        competency={selectedCompetency}
        pendingUsers={pendingUsers || []}
      />
    </>
  );
};