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

      // Fetch payments summary
      const { data: payments } = await supabase
        .from('payments')
        .select('status, amount')
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

      const paymentsByStatus = payments?.reduce((acc, payment) => {
        if (!acc[payment.status]) acc[payment.status] = { count: 0, total: 0 };
        acc[payment.status].count++;
        acc[payment.status].total += Number(payment.amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>) || {};

      const expenseTotal = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      return {
        receivedCount: paymentsByStatus.paid?.count || 0,
        receivedTotal: paymentsByStatus.paid?.total || 0,
        confirmedCount: paymentsByStatus.pending?.count || 0,
        confirmedTotal: paymentsByStatus.pending?.total || 0,
        pendingCount: paymentsByStatus.draft?.count || 0,
        pendingTotal: paymentsByStatus.draft?.total || 0,
        overdueCount: 0, // TODO: Calculate overdue based on due_date < today
        overdueTotal: 0,
        expenseCount: expenses?.length || 0,
        expenseTotal
      };
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-indigo-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-indigo-600 cursor-not-allowed"
            disabled
          >
            <Menu className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-indigo-600 cursor-not-allowed"
              disabled
            >
              <Bell className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-indigo-600 cursor-not-allowed"
              disabled
            >
              <User className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Referral Banner */}
        <Card className="flex items-center gap-4 bg-indigo-50 p-4">
          <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-indigo-900">Indique o Declara Psi</h3>
            <p className="text-sm text-indigo-800">
              Ganhe <strong>3 meses grátis</strong> ao indicar uma colega.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/referral')} 
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Indicar
          </Button>
        </Card>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-4 gap-2 overflow-x-auto">
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

        {/* Summary Card */}
        <SummaryCard 
          data={summaryData || {
            receivedCount: 0,
            receivedTotal: 0,
            confirmedCount: 0,
            confirmedTotal: 0,
            pendingCount: 0,
            pendingTotal: 0,
            overdueCount: 0,
            overdueTotal: 0,
            expenseCount: 0,
            expenseTotal: 0
          }}
          isLoading={summaryLoading}
        />

        {/* Navigation Modules */}
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Módulos</h2>
          <div className="grid grid-cols-3 gap-4">
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
  );
};

export default Dashboard;
