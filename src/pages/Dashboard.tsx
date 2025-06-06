import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, Bell, User, CreditCard, Calculator, FileText } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleTile } from "@/components/dashboard/ModuleTile";
import { QuickTile } from "@/components/dashboard/QuickTile";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  // Fetch summary data for current month
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get today's date for overdue calculation
      const today = new Date().toISOString().split('T')[0];

      // Fetch payments summary
      const { data: payments } = await supabase
        .from('payments')
        .select('status, amount, due_date')
        .eq('owner_id', user.id)
        .gte('due_date', startOfMonth.toISOString().split('T')[0])
        .lte('due_date', endOfMonth.toISOString().split('T')[0]);

      // Fetch expenses summary
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('owner_id', user.id)
        .gte('payment_date', startOfMonth.toISOString().split('T')[0])
        .lte('payment_date', endOfMonth.toISOString().split('T')[0]);

      const totals = {
        receivedCount: 0, receivedTotal: 0,
        pendingCount: 0, pendingTotal: 0,
        overdueCount: 0, overdueTotal: 0,
      };

      payments?.forEach(payment => {
        const amount = Number(payment.amount);
        
        if (payment.status === 'paid') {
          // Recebidas: status = "paid"
          totals.receivedCount++;
          totals.receivedTotal += amount;
        } else if (['draft', 'pending'].includes(payment.status)) {
          if (payment.due_date >= today) {
            // Aguardando pagamento: status IN ("draft","pending") AND due_date >= today
            totals.pendingCount++;
            totals.pendingTotal += amount;
          } else {
            // Vencidas: status IN ("draft","pending") AND due_date < today
            totals.overdueCount++;
            totals.overdueTotal += amount;
          }
        }
      });

      const expenseTotal = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      return {
        receivedCount: totals.receivedCount,
        receivedTotal: totals.receivedTotal,
        pendingCount: totals.pendingCount,
        pendingTotal: totals.pendingTotal,
        overdueCount: totals.overdueCount,
        overdueTotal: totals.overdueTotal,
        expenseCount: expenses?.length || 0,
        expenseTotal,
        // Include optional properties for backward compatibility
        confirmedCount: 0,
        confirmedTotal: 0
      };
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-psiclo-primary"></div>
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

              {/* Quick Action Tiles - Made horizontally scrollable on mobile */}
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

              {/* Navigation Modules - Made more responsive */}
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
