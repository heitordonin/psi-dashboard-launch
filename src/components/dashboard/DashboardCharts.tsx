
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueExpenseChart } from "./RevenueExpenseChart";
import { MarginKPI } from "./MarginKPI";
import { GaugeChart } from "./GaugeChart";

export const DashboardCharts = () => {
  const { user } = useAuth();

  const { data: paymentsData = [] } = useQuery({
    queryKey: ['dashboard-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('owner_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: expensesData = [] } = useQuery({
    queryKey: ['dashboard-expenses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_categories!inner(*)')
        .eq('owner_id', user.id);
      
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
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Calculate tax-related expenses for effective tax rate
  // This should be filtered to only include tax-related categories
  const taxExpenses = expensesData
    .filter(expense => {
      // Filter only expenses that are tax-related
      // You might want to add specific category codes for taxes here
      const category = expense.expense_categories;
      return category && (
        category.code?.includes('TAX') || 
        category.name?.toLowerCase().includes('imposto') ||
        category.name?.toLowerCase().includes('taxa') ||
        category.code === 'IRPF' ||
        category.code === 'CSLL' ||
        category.code === 'PIS' ||
        category.code === 'COFINS'
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const margin = totalRevenue - totalExpenses;
  const marginPercentage = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

  // Calculate effective tax rate using only tax-related expenses
  const effectiveRate = totalRevenue > 0 ? Math.min((taxExpenses / totalRevenue) * 100, 100) : 0;

  const hasData = paymentsData.length > 0 || expensesData.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue vs Expense Chart - moved to first position */}
      <Card className="lg:col-span-2">
        <CardContent>
          <RevenueExpenseChart 
            revenue={totalRevenue}
            expense={totalExpenses}
          />
        </CardContent>
      </Card>

      {/* Margin KPI - moved to second position */}
      <Card>
        <CardContent>
          <MarginKPI 
            margin={marginPercentage}
            hasData={hasData}
          />
        </CardContent>
      </Card>

      {/* Effective Rate Gauge - moved to third position */}
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
