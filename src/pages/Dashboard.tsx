
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, Bell, User, CreditCard, Calculator, FileText } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleTile } from "@/components/dashboard/ModuleTile";
import { QuickTile } from "@/components/dashboard/QuickTile";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface DateFilter {
  startDate: string;
  endDate: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to login');
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Create a stable query key to prevent infinite re-renders
  const queryKey = ['dashboard-summary', user?.id, dateFilter?.startDate, dateFilter?.endDate];

  // Fetch summary data for current month or selected period
  const { data: summaryData, isLoading: summaryLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for summary query');
        return null;
      }

      console.log('Fetching dashboard summary data');

      let startOfPeriod: Date;
      let endOfPeriod: Date;

      if (dateFilter) {
        startOfPeriod = new Date(dateFilter.startDate);
        endOfPeriod = new Date(dateFilter.endDate);
      } else {
        // Use current month as default
        const now = new Date();
        startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
        endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      // Get today's date for overdue calculation
      const today = new Date().toISOString().split('T')[0];

      try {
        // Fetch payments summary
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('status, amount, due_date')
          .eq('owner_id', user.id)
          .gte('due_date', startOfPeriod.toISOString().split('T')[0])
          .lte('due_date', endOfPeriod.toISOString().split('T')[0]);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          throw paymentsError;
        }

        // Fetch expenses summary
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('owner_id', user.id)
          .gte('payment_date', startOfPeriod.toISOString().split('T')[0])
          .lte('payment_date', endOfPeriod.toISOString().split('T')[0]);

        if (expensesError) {
          console.error('Error fetching expenses:', expensesError);
          throw expensesError;
        }

        const totals = {
          receivedCount: 0, receivedTotal: 0,
          pendingCount: 0, pendingTotal: 0,
          overdueCount: 0, overdueTotal: 0,
        };

        payments?.forEach(payment => {
          const amount = Number(payment.amount);
          
          if (payment.status === 'paid') {
            totals.receivedCount++;
            totals.receivedTotal += amount;
          } else if (['draft', 'pending'].includes(payment.status)) {
            if (payment.due_date >= today) {
              totals.pendingCount++;
              totals.pendingTotal += amount;
            } else {
              totals.overdueCount++;
              totals.overdueTotal += amount;
            }
          }
        });

        const expenseTotal = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

        console.log('Dashboard summary fetched successfully');

        return {
          receivedCount: totals.receivedCount,
          receivedTotal: totals.receivedTotal,
          pendingCount: totals.pendingCount,
          pendingTotal: totals.pendingTotal,
          overdueCount: totals.overdueCount,
          overdueTotal: totals.overdueTotal,
          expenseCount: expenses?.length || 0,
          expenseTotal,
          confirmedCount: 0,
          confirmedTotal: 0
        };
      } catch (error) {
        console.error('Error in dashboard summary query:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: 1000
  });

  const handleDateFilterChange = (filter: DateFilter | null) => {
    console.log('Date filter changed:', filter);
    setDateFilter(filter);
  };

  // Show loading only during auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-psiclo-primary"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  // Show error state if query failed
  if (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Erro ao carregar dashboard. Tente novamente.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            {/* Top Bar */}
            <div className="bg-psiclo-primary px-4 py-4">
              <div className="flex items-center justify-between">
                <SidebarTrigger className="text-white hover:bg-psiclo-secondary" />
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-psiclo-secondary cursor-not-allowed"
                    disabled
                  >
                    <Bell className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/profile')}
                    className="text-white hover:bg-psiclo-secondary"
                  >
                    <User className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Referral Banner */}
              <Card className="flex items-center gap-4 bg-psiclo-accent/10 p-4">
                <div className="w-10 h-10 bg-psiclo-accent/20 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-psiclo-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-psiclo-primary">Indique o Psiclo</h3>
                  <p className="text-sm text-psiclo-secondary">
                    Ganhe <strong>3 meses grátis</strong> ao indicar uma colega.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/referral')} 
                  size="sm"
                  className="bg-psiclo-primary hover:bg-psiclo-secondary"
                >
                  Indicar
                </Button>
              </Card>

              {/* Quick Action Tiles */}
              <div className="overflow-x-auto">
                <div className="flex gap-3 pb-2 min-w-max md:grid md:grid-cols-4 md:gap-4">
                  <QuickTile
                    icon={CreditCard}
                    label="Criar cobrança"
                    onClick={() => navigate('/payments')}
                  />
                  <QuickTile
                    icon={FileText}
                    label="Link pagamento"
                    onClick={() => {}}
                    disabled
                  />
                  <QuickTile
                    icon={Calculator}
                    label="Simular IR"
                    onClick={() => {}}
                    disabled
                  />
                  <QuickTile
                    icon={FileText}
                    label="Registrar despesa"
                    onClick={() => navigate('/expenses')}
                  />
                </div>
              </div>

              {/* Dashboard Charts Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-psiclo-primary">Visão Geral Financeira</h2>
                <DashboardCharts onDateFilterChange={handleDateFilterChange} />
              </div>

              {/* Summary Card */}
              <SummaryCard 
                data={summaryData || {
                  receivedCount: 0,
                  receivedTotal: 0,
                  pendingCount: 0,
                  pendingTotal: 0,
                  overdueCount: 0,
                  overdueTotal: 0,
                  expenseCount: 0,
                  expenseTotal: 0,
                  confirmedCount: 0,
                  confirmedTotal: 0
                }}
                isLoading={summaryLoading}
              />

              {/* Navigation Modules */}
              <div className="bg-white p-4 md:p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Módulos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <ModuleTile
                    icon={User}
                    color="indigo"
                    label="Pacientes"
                    to="/patients"
                  />
                  <ModuleTile
                    icon={CreditCard}
                    color="green"
                    label="Cobranças"
                    to="/payments"
                  />
                  <ModuleTile
                    icon={FileText}
                    color="purple"
                    label="Despesas"
                    to="/expenses"
                  />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
