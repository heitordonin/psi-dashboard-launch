import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ModuleTile } from "@/components/dashboard/ModuleTile";
import { QuickTile } from "@/components/dashboard/QuickTile";
import { ReceitaSaudeTile } from "@/components/dashboard/ReceitaSaudeTile";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Users, CreditCard, Receipt, Plus, UserPlus, DollarSign, User } from "lucide-react";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  // Fetch payments data with date filter
  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['dashboard-payments', user?.id, startDate, endDate],
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

  // Fetch expenses data with date filter
  const { data: expensesData = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['dashboard-expenses', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('expenses')
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

  // Calculate summary data
  const summaryData = {
    receivedCount: paymentsData.filter(p => p.status === 'paid').length,
    receivedTotal: paymentsData
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pendingCount: paymentsData.filter(p => p.status === 'pending').length,
    pendingTotal: paymentsData
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    overdueCount: paymentsData.filter(p => p.status === 'pending' && new Date(p.due_date) < new Date()).length,
    overdueTotal: paymentsData
      .filter(p => p.status === 'pending' && new Date(p.due_date) < new Date())
      .reduce((sum, p) => sum + Number(p.amount), 0),
    expenseCount: expensesData.length,
    expenseTotal: expensesData.reduce((sum, e) => sum + Number(e.amount), 0)
  };

  const isLoadingSummary = paymentsLoading || expensesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white hover:text-gray-200" />
                  <div>
                    <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Dashboard</h1>
                    <p className="text-sm" style={{ color: '#03f6f9' }}>Bem-vindo ao seu painel de controle</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/profile")}
                  className="text-white hover:text-gray-200 hover:bg-white/10"
                >
                  <User className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* 1. Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      <QuickTile
                        icon={UserPlus}
                        label="Novo Paciente"
                        onClick={() => navigate("/patients")}
                      />
                      <QuickTile
                        icon={Plus}
                        label="Nova Cobrança"
                        onClick={() => navigate("/payments")}
                      />
                      <QuickTile
                        icon={DollarSign}
                        label="Nova Despesa"
                        onClick={() => navigate("/expenses")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Period Filter */}
              <PeriodFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />

              {/* 3. Charts */}
              <DashboardCharts 
                startDate={startDate}
                endDate={endDate}
              />

              {/* 4. Summary Card */}
              <SummaryCard data={summaryData} isLoading={isLoadingSummary} />

              {/* 5. Modules Grid */}
              <Card>
                <CardHeader>
                  <CardTitle>Módulos do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ModuleTile
                      icon={Users}
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
                      icon={Receipt}
                      color="purple"
                      label="Despesas"
                      to="/expenses"
                    />
                    <ReceitaSaudeTile />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
