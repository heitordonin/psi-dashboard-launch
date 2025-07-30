
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ModulesGrid } from "@/components/dashboard/ModulesGrid";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showTodayAppointments, setShowTodayAppointments] = useState(() => {
    const saved = localStorage.getItem('showTodayAppointments');
    return saved !== 'false'; // Default to true
  });

  const { summaryData, isLoadingSummary } = useDashboardData(startDate, endDate);

  const handleToggleAppointments = (checked: boolean) => {
    setShowTodayAppointments(checked);
    localStorage.setItem('showTodayAppointments', checked.toString());
  };

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
            <DashboardHeader />

            <div className="container mx-auto px-4 py-6 space-y-6">
              <QuickActions />

              <Card className="border-dashed border-muted-foreground/25">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Mostrar agendamentos de hoje</span>
                  </div>
                  <Switch 
                    checked={showTodayAppointments}
                    onCheckedChange={handleToggleAppointments}
                  />
                </CardContent>
              </Card>

              {showTodayAppointments && <TodayAppointments />}

              <PeriodFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />

              <DashboardCharts 
                startDate={startDate}
                endDate={endDate}
              />

              <SummaryCard data={summaryData} isLoading={isLoadingSummary} />

              <ModulesGrid />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
