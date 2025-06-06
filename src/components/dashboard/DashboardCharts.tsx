
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateFilter {
  startDate: string;
  endDate: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DashboardChartsProps {
  onDateFilterChange?: (filter: DateFilter | null) => void;
}

export function DashboardCharts({ onDateFilterChange }: DashboardChartsProps) {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Create stable query key
  const queryKey = ['dashboard-charts', user?.id, dateFilter?.startDate, dateFilter?.endDate];

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID for charts query');
        return null;
      }

      console.log('Fetching dashboard charts data');

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

      try {
        // Fetch paid payments (receitas)
        const { data: paidPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .eq('owner_id', user.id)
          .eq('status', 'paid')
          .gte('paid_date', startDate.toISOString().split('T')[0])
          .lte('paid_date', endDate.toISOString().split('T')[0]);

        if (paymentsError) {
          console.error('Error fetching paid payments:', paymentsError);
          throw paymentsError;
        }

        // Fetch DARF Carnê-Leão expenses for alíquota efetiva calculation
        const { data: darfExpenses, error: darfError } = await supabase
          .from('expenses')
          .select('amount, residential_adjusted_amount')
          .eq('owner_id', user.id)
          .eq('category_id', '0cba18f0-c319-4259-a4af-ed505ee20279')
          .eq('competency', competencyFilter);

        if (darfError) {
          console.error('Error fetching DARF expenses:', darfError);
          throw darfError;
        }

        // Fetch all expenses for margin calculation
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('amount, residential_adjusted_amount, is_residential')
          .eq('owner_id', user.id)
          .gte('payment_date', startDate.toISOString().split('T')[0])
          .lte('payment_date', endDate.toISOString().split('T')[0]);

        if (expensesError) {
          console.error('Error fetching expenses:', expensesError);
          throw expensesError;
        }

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

        console.log('Dashboard charts data fetched successfully');

        return {
          aliquotaEfetiva,
          totalReceitas,
          totalDespesas,
          margin,
          hasRevenue: totalReceitas > 0,
          hasDarf: totalDarf > 0
        };
      } catch (error) {
        console.error('Error in dashboard charts query:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: 1000
  });

  const handleTabChange = (value: string) => {
    if (value === "this-month") {
      const newFilter = null;
      setDateFilter(newFilter);
      onDateFilterChange?.(newFilter);
    }
  };

  const handleDateRangeSelect = () => {
    if (dateRange.from && dateRange.to) {
      const newFilter = {
        startDate: dateRange.from.toISOString().split('T')[0],
        endDate: dateRange.to.toISOString().split('T')[0]
      };
      setDateFilter(newFilter);
      onDateFilterChange?.(newFilter);
      setIsDatePickerOpen(false);
    }
  };

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

  if (error) {
    console.error('Dashboard charts error:', error);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500 text-center">Erro ao carregar dados dos gráficos</p>
          </CardContent>
        </Card>
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
          <Tabs defaultValue="this-month" onValueChange={handleTabChange}>
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
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {dateRange.from && dateRange.to 
                        ? `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`
                        : "Selecionar período"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Data inicial</label>
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                            className="rounded-md border pointer-events-auto"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Data final</label>
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                            className="rounded-md border pointer-events-auto"
                            disabled={(date) => !dateRange.from || date < dateRange.from}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleDateRangeSelect}
                          disabled={!dateRange.from || !dateRange.to}
                          className="flex-1"
                        >
                          Aplicar
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsDatePickerOpen(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
