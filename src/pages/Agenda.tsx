import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CreateAppointmentWizard } from "@/components/agenda/CreateAppointmentWizard";
import { AgendaHeader } from "@/components/agenda/AgendaHeader";
import { AgendaKPIs } from "@/components/agenda/AgendaKPIs";
import { AgendaCalendarView } from "@/components/agenda/AgendaCalendarView";
import { useAppointments } from "@/hooks/useAppointments";
import { Appointment } from "@/types/appointment";

export default function Agenda() {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { appointments, isLoading, updateAppointment } = useAppointments();

  const handleUpdateAppointmentStatus = (appointmentId: string, status: Appointment['status']) => {
    updateAppointment({ id: appointmentId, status });
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowCreateWizard(true);
  };

  const handleCloseWizard = () => {
    setShowCreateWizard(false);
    setEditingAppointment(null);
  };

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
                onUpdateAppointment={handleUpdateAppointmentStatus}
                onEditAppointment={handleEditAppointment}
              />

              <CreateAppointmentWizard
                isOpen={showCreateWizard}
                onClose={handleCloseWizard}
                editingAppointment={editingAppointment}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}