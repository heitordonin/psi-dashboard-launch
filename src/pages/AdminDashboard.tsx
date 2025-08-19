
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { AdminDashboardLoading } from "@/components/admin/AdminDashboardLoading";
import { AdminKPICards } from "@/components/admin/AdminKPICards";
import { AdminUserGrowthChart } from "@/components/admin/AdminUserGrowthChart";
import { AdminTopEarnersTable } from "@/components/admin/AdminTopEarnersTable";
import { AdminTopWhatsAppUsersTable } from "@/components/admin/AdminTopWhatsAppUsersTable";
import { AdminFinancialKPIs } from "@/components/admin/AdminFinancialKPIs";
import { AdminChurnMetrics } from "@/components/admin/AdminChurnMetrics";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";

const AdminDashboard = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [whatsappStartDate, setWhatsappStartDate] = useState<string>("");
  const [whatsappEndDate, setWhatsappEndDate] = useState<string>("");

  const { userKpis, userKpisByPlan, userGrowth, userGrowthByPlan, topEarners, topWhatsAppUsers, mrrMetrics, churnMetrics, ltvMetrics, conversionMetrics, isLoading } = useAdminDashboardData(whatsappStartDate, whatsappEndDate);

  if (isLoading) {
    return <AdminDashboardLoading />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <AdminDashboardHeader />
          <div className="container mx-auto p-6 space-y-6">
            <AdminKPICards userKpis={userKpis} userKpisByPlan={userKpisByPlan} />
            
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Métricas Financeiras</h2>
              <AdminFinancialKPIs mrrMetrics={mrrMetrics} ltvMetrics={ltvMetrics} />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Churn e Retenção</h2>
              <PeriodFilter 
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
              <AdminChurnMetrics churnMetrics={churnMetrics} conversionMetrics={conversionMetrics} />
            </div>

            <AdminUserGrowthChart 
              userGrowthByPlan={userGrowthByPlan}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            <AdminTopEarnersTable topEarners={topEarners} />
            
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Top 10 Psicólogos - Mensagens WhatsApp</h2>
              <PeriodFilter 
                startDate={whatsappStartDate}
                endDate={whatsappEndDate}
                onStartDateChange={setWhatsappStartDate}
                onEndDateChange={setWhatsappEndDate}
              />
              <AdminTopWhatsAppUsersTable topWhatsAppUsers={topWhatsAppUsers} />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
