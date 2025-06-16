
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
import { AdminProtectionTest } from "@/components/admin/AdminProtectionTest";

const AdminDashboard = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { userKpis, userGrowth, topEarners, isLoading } = useAdminDashboardData(startDate, endDate);

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
            {/* Componente de teste - remover em produção */}
            {import.meta.env.MODE === 'development' && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Status de Proteção Admin:</h3>
                <AdminProtectionTest />
              </div>
            )}
            
            <AdminKPICards userKpis={userKpis} />
            <AdminUserGrowthChart 
              userGrowth={userGrowth}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            <AdminTopEarnersTable topEarners={topEarners} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
