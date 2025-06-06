
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GaugeChart } from "./GaugeChart";
import { RevenueExpenseChart } from "./RevenueExpenseChart";
import { MarginKPI } from "./MarginKPI";

export function DashboardCharts() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-charts', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch paid payments (receitas)
      const { data: paidPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('owner_id', user.id)
        .eq('status', 'paid')
        .gte('paid_date', startOfMonth.toISOString().split('T')[0])
        .lte('paid_date', endOfMonth.toISOString().split('T')[0]);

      // Fetch DARF payments (for alíquota efetiva calculation)
      // Note: Since rs_type doesn't exist in current schema, we'll use a placeholder
      // This will need to be adjusted when the field is added to the payments table
      const { data: darfPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('owner_id', user.id)
        .eq('status', 'paid')
        .gte('paid_date', startOfMonth.toISOString().split('T')[0])
        .lte('paid_date', endOfMonth.toISOString().split('T')[0]);
        // .eq('rs_type', 'darf'); // This field doesn't exist yet

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, residential_adjusted_amount, is_residential')
        .eq('owner_id', user.id)
        .gte('payment_date', startOfMonth.toISOString().split('T')[0])
        .lte('payment_date', endOfMonth.toISOString().split('T')[0]);

      const totalReceitas = paidPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      
      // For now, using 0 for DARF until the rs_type field is added
      const totalDarf = 0; // darfPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      
      const totalDespesas = expenses?.reduce((sum, expense) => {
        const amount = expense.is_residential && expense.residential_adjusted_amount 
          ? Number(expense.residential_adjusted_amount)
          : Number(expense.amount);
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
