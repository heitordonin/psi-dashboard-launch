import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { RevenueExpenseChart } from "./RevenueExpenseChart";
import { MarginKPI } from "./MarginKPI";
import { GaugeChart } from "./GaugeChart";

interface DashboardChartsProps {
  startDate: string;
  endDate: string;
}

export const DashboardCharts = ({ startDate, endDate }: DashboardChartsProps) => {
  const { user } = useAuth();

  const { data: paymentsData = [] } = useQuery({
    queryKey: ['dashboard-payments-charts', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('payments')
        .select('*')
        .eq('owner_id', user.id);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: expensesData = [] } = useQuery({
    queryKey: ['dashboard-expenses-charts', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('expenses')
        .select('*, expense_categories!inner(*)')
        .eq('owner_id', user.id);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Calculate totals
  const totalRevenue = paymentsData
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const totalExpenses = expensesData
    .reduce((sum, expense) => sum + Number(expense.residential_adjusted_amount ?? expense.amount), 0);

  // Calculate DARF Carnê-Leão expenses for effective tax rate
  // Filter for DARF Carnê-Leão category and expenses with competency in the filtered period
  const darfCarneLeaoExpenses = expensesData
    .filter(expense => {
      const category = expense.expense_categories;
      const isDarfCarneLeao = category && (
        category.code === 'P20.01.00004' ||
        category.name?.toLowerCase().includes('darf') ||
        category.name?.toLowerCase().includes('carnê-leão') ||
        category.name?.toLowerCase().includes('carne leao')
      );
      
      // Only include expenses with competency and within the filtered period
      if (!isDarfCarneLeao || !expense.competency) return false;
      
      // If we have date filters, check if competency falls within the period
      if (startDate || endDate) {
        const competencyDate = new Date(expense.competency);
        if (startDate && competencyDate < new Date(startDate)) return false;
        if (endDate && competencyDate > new Date(endDate)) return false;
      }
      
      return true;
    })
    .reduce((sum, expense) => sum + Number(expense.residential_adjusted_amount ?? expense.amount), 0);

  const margin = totalRevenue - totalExpenses;
  const marginPercentage = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

  // Calculate effective tax rate using DARF Carnê-Leão formula
  const effectiveRate = totalRevenue > 0 ? Math.min((darfCarneLeaoExpenses / totalRevenue) * 100, 100) : 0;

  const hasData = paymentsData.length > 0 || expensesData.length > 0;

  console.log('DashboardCharts - DARF Carnê-Leão calculation:', {
    totalRevenue,
    darfCarneLeaoExpenses,
    effectiveRate,
    filteredExpenses: expensesData.filter(expense => {
      const category = expense.expense_categories;
      return category && (
        category.code === 'P20.01.00004' ||
        category.name?.toLowerCase().includes('darf') ||
        category.name?.toLowerCase().includes('carnê-leão')
      );
    })
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue vs Expense Chart */}
      <Card className="lg:col-span-2">
        <CardContent>
          <RevenueExpenseChart 
            revenue={totalRevenue}
            expense={totalExpenses}
          />
        </CardContent>
      </Card>

      {/* Margin KPI */}
      <Card>
        <CardContent>
          <MarginKPI 
            margin={marginPercentage}
            hasData={hasData}
          />
        </CardContent>
      </Card>

      {/* Effective Rate Gauge */}
      <Card className="lg:col-span-3">
        <CardContent>
          <GaugeChart 
            percentage={effectiveRate}
            hasData={hasData}
          />
        </CardContent>
      </Card>
    </div>
  );
};
