
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ModuleTile } from "@/components/dashboard/ModuleTile";
import { QuickTile } from "@/components/dashboard/QuickTile";
import { ReceitaSaudeTile } from "@/components/dashboard/ReceitaSaudeTile";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { Users, CreditCard, Receipt, Plus, UserPlus, DollarSign } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

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
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Dashboard</h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>Bem-vindo ao seu painel de controle</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Quick Actions */}
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

              {/* Charts */}
              <DashboardCharts />

              {/* Modules Grid - Moved to the end */}
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
