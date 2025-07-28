import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAppointments } from "@/hooks/useAppointments";
import { CalendarFilters } from "@/types/appointment";
import { Appointment } from "@/types/appointment";
import { useIsMobile } from "@/hooks/use-mobile";
import { startOfWeek, endOfWeek } from "date-fns";
import { MobileAgendaLayout } from "@/components/agenda/layouts/MobileAgendaLayout";
import { DesktopAgendaLayout } from "@/components/agenda/layouts/DesktopAgendaLayout";

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const isMobile = useIsMobile();
  
  // Configurar filtros com range semanal para carregar agendamentos da semana toda
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Domingo como início
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  
  const filters: CalendarFilters = {
    weekRange: {
      startDate: weekStart,
      endDate: weekEnd
    }
  };
  
  const { appointments, isLoading, updateAppointment, deleteAppointment, isDeleting } = useAppointments(filters);

  console.log('📅 Agenda page - Selected date:', selectedDate);
  console.log('📋 Agenda page - Appointments loaded:', appointments?.length || 0);
  console.log('🔄 Agenda page - Is loading:', isLoading);

  const handleUpdateAppointmentStatus = (appointmentId: string, status: Appointment['status']) => {
    console.log('🔄 Updating appointment status:', appointmentId, status);
    updateAppointment({ id: appointmentId, status });
  };

  // Unified Layout - com sidebar para mobile e desktop
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        {isMobile ? (
          <MobileAgendaLayout
            appointments={appointments || []}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onUpdateAppointment={handleUpdateAppointmentStatus}
            onEditAppointment={(appointment) => console.log('Edit appointment:', appointment)}
            onDeleteAppointment={deleteAppointment}
            isDeleting={isDeleting}
          />
        ) : (
          <SidebarInset>
            <DesktopAgendaLayout
              appointments={appointments || []}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onUpdateAppointment={handleUpdateAppointmentStatus}
              onEditAppointment={(appointment) => console.log('Edit appointment:', appointment)}
              onDeleteAppointment={deleteAppointment}
              isDeleting={isDeleting}
              isLoading={isLoading}
            />
          </SidebarInset>
        )}
      </div>
    </SidebarProvider>
  );
}