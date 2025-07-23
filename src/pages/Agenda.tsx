import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CreateAppointmentWizard } from "@/components/agenda/CreateAppointmentWizard";
import { AgendaHeader } from "@/components/agenda/AgendaHeader";
import { AgendaKPIs } from "@/components/agenda/AgendaKPIs";
import { AgendaCalendarView } from "@/components/agenda/AgendaCalendarView";
import { useAppointments } from "@/hooks/useAppointments";

export default function Agenda() {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const { appointments, isLoading } = useAppointments();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-background">
            <AgendaHeader onNewAppointment={() => setShowCreateWizard(true)} />
            
            <div className="container mx-auto p-6 space-y-6">
              <AgendaKPIs 
                appointments={appointments || []} 
                selectedDate={selectedDate}
              />
              
              <AgendaCalendarView
                appointments={appointments || []}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              <CreateAppointmentWizard
                isOpen={showCreateWizard}
                onClose={() => setShowCreateWizard(false)}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}