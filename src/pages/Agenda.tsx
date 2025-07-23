import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CreateAppointmentWizard } from "@/components/agenda/CreateAppointmentWizard";
import { AgendaHeader } from "@/components/agenda/AgendaHeader";
import { AgendaKPIs } from "@/components/agenda/AgendaKPIs";
import { AgendaCalendarView } from "@/components/agenda/AgendaCalendarView";
import { useAppointments } from "@/hooks/useAppointments";
import { CalendarFilters } from "@/types/appointment";
import { Appointment } from "@/types/appointment";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Agenda() {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const queryClient = useQueryClient();
  
  // Configurar filtros para sincronização de estado correta
  const filters: CalendarFilters = {
    date: selectedDate
  };
  
  const { appointments, isLoading, updateAppointment } = useAppointments(filters);

  console.log('📅 Agenda page - Selected date:', selectedDate);
  console.log('📋 Agenda page - Appointments loaded:', appointments?.length || 0);
  console.log('🔄 Agenda page - Is loading:', isLoading);

  const handleUpdateAppointmentStatus = (appointmentId: string, status: Appointment['status']) => {
    console.log('🔄 Updating appointment status:', appointmentId, status);
    updateAppointment({ id: appointmentId, status });
  };

  const handleEditAppointment = (appointment: Appointment) => {
    console.log('✏️ Editing appointment:', appointment.id);
    setEditingAppointment(appointment);
    setShowCreateWizard(true);
  };

  const handleCloseWizard = () => {
    console.log('❌ Closing wizard');
    setShowCreateWizard(false);
    setEditingAppointment(null);
    // Força refresh após fechar wizard
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }, 100);
  };

  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.refetchQueries({ queryKey: ['appointments'] });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-background">
            <AgendaHeader onNewAppointment={() => setShowCreateWizard(true)} />
            
            <div className="container mx-auto p-6 space-y-6">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
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