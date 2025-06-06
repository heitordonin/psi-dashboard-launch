
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GaugeChart } from "./GaugeChart";
import { RevenueExpenseChart } from "./RevenueExpenseChart";
import { MarginKPI } from "./MarginKPI";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DateFilter {
  startDate: string;
  endDate: string;
}

export function DashboardCharts() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  const [customDateOpen, setCustomDateOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-charts', user?.id, dateFilter],
    queryFn: async () => {
      if (!user?.id) return null;

      let startDate: Date;
      let endDate: Date;

      if (dateFilter) {
        startDate = new Date(dateFilter.startDate);
        endDate = new Date(dateFilter.endDate);
      } else {
        // Use current month as default
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const competencyFilter = `${String(startDate.getMonth() + 1).padStart(2, '0')}/${startDate.getFullYear()}`;

      // Fetch paid payments (receitas)
      const { data: paidPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('owner_id', user.id)
        .eq('status', 'paid')
        .gte('paid_date', startDate.toISOString().split('T')[0])
        .lte('paid_date', endDate.toISOString().split('T')[0]);

      // Fetch DARF Carnê-Leão expenses for alíquota efetiva calculation
      const { data: darfExpenses } = await supabase
        .from('expenses')
        .select('amount, residential_adjusted_amount, expense_categories!inner(code)')
        .eq('owner_id', user.id)
        .eq('expense_categories.code', 'DARF_CARNE_LEAO')
        .eq('competency', competencyFilter);

      // Fetch all expenses for margin calculation
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, residential_adjusted_amount, is_residential')
        .eq('owner_id', user.id)
        .gte('payment_date', startDate.toISOString().split('T')[0])
        .lte('payment_date', endDate.toISOString().split('T')[0]);

      const totalReceitas = paidPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      
      // Calculate total DARF using residential_adjusted_amount
      const totalDarf = darfExpenses?.reduce((sum, expense) => {
        const amount = expense.residential_adjusted_amount || expense.amount;
        return sum + Number(amount);
      }, 0) || 0;
      
      const totalDespesas = expenses?.reduce((sum, expense) => {
        const amount = expense.residential_adjusted_amount || expense.amount;
        return sum + amount;
      }, 0) || 0;

      // Calculate alíquota efetiva
      const aliquotaEfetiva = totalReceitas > 0 ? (totalDarf / totalReceitas) * 100 : 0;
      
      // Calculate margin
      const margin = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0;

      return {
        aliquotaEfetiva,
        totalReceitas,
        totalDespesas,
        margin,
        hasRevenue: totalReceitas > 0,
        hasDarf: totalDarf > 0
      };
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { aliquotaEfetiva, totalReceitas, totalDespesas, margin, hasRevenue, hasDarf } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Período de análise</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="this-month">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="this-month">Este mês</TabsTrigger>
              <TabsTrigger value="custom">Data personalizada</TabsTrigger>
            </TabsList>
            
            <TabsContent value="this-month" className="mt-4">
              <p className="text-sm text-gray-600">
                Exibindo dados do mês atual
              </p>
            </TabsContent>
            
            <TabsContent value="custom" className="mt-4">
              <div className="flex flex-col items-center space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCustomDateOpen(!customDateOpen)}
                  className="w-full"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Selecionar período
                </Button>
                <p className="text-sm text-gray-500 text-center">
                  Funcionalidade em desenvolvimento
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alíquota efetiva - Full width */}
      <GaugeChart 
        percentage={aliquotaEfetiva} 
        hasData={hasRevenue && hasDarf} 
      />
      
      {/* Receita x Despesa and Margem - Side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueExpenseChart 
          revenue={totalReceitas} 
          expense={totalDespesas} 
        />
        <MarginKPI 
          margin={margin} 
          hasData={hasRevenue} 
        />
      </div>
    </div>
  );
}
