
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
import { AdminDarfControlBox } from "@/components/admin/AdminDarfControlBox";
import { AdminFinancialKPIs } from "@/components/admin/AdminFinancialKPIs";
import { AdminChurnMetrics } from "@/components/admin/AdminChurnMetrics";

const AdminDashboard = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { userKpis, userKpisByPlan, userGrowth, userGrowthByPlan, topEarners, mrrMetrics, churnMetrics, ltvMetrics, conversionMetrics, isLoading } = useAdminDashboardData(startDate, endDate);

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
              <AdminChurnMetrics churnMetrics={churnMetrics} conversionMetrics={conversionMetrics} />
            </div>

            <AdminUserGrowthChart 
              userGrowthByPlan={userGrowthByPlan}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            <AdminDarfControlBox />
            <AdminTopEarnersTable topEarners={topEarners} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
