import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MobileHeader } from "@/components/ui/mobile-header";
import { AgendaKPIs } from "../AgendaKPIs";
import { MobileKPIsVertical } from "../mobile/MobileKPIsVertical";
import { MobileCompactCalendar } from "../mobile/MobileCompactCalendar";
import { MobileThreeDaysView } from "../mobile/MobileThreeDaysView";
import { CreateAppointmentWizard } from "../CreateAppointmentWizard";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { PullToRefreshContainer } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Plus } from "lucide-react";
import { CalendarFilters, Appointment } from "@/types/appointment";

interface MobileAgendaLayoutProps {
  appointments: Appointment[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onUpdateAppointment: (appointmentId: string, status: Appointment['status']) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
  isDeleting?: boolean;
}

export const MobileAgendaLayout = ({
  appointments,
  selectedDate,
  setSelectedDate,
  onUpdateAppointment,
  onEditAppointment,
  onDeleteAppointment,
  isDeleting
}: MobileAgendaLayoutProps) => {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const queryClient = useQueryClient();

  const handleManualRefresh = async () => {
    console.log('🔄 Mobile refresh triggered');
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    await queryClient.refetchQueries({ queryKey: ['appointments'] });
  };

  const { 
    containerRef, 
    isRefreshing, 
    pullDistance, 
    isPulling, 
    isTriggered, 
    bindTouchEvents 
  } = usePullToRefresh({
    onRefresh: handleManualRefresh,
    threshold: 80
  });

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowCreateWizard(true);
  };

  const handleCloseWizard = () => {
    setShowCreateWizard(false);
    setEditingAppointment(null);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background" {...bindTouchEvents}>
      <MobileHeader 
        title="Agenda" 
        subtitle="Gerencie seus agendamentos e sessões"
      />
      
      <PullToRefreshContainer
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        isTriggered={isTriggered}
      >
        <div ref={containerRef} className="mobile-container">
          {/* KPIs integrados no mobile */}
          <div className="mobile-spacing">
            <MobileKPIsVertical
              appointments={appointments}
              selectedDate={selectedDate}
            />
          </div>

          {/* Calendário compacto */}
          <div className="mobile-spacing">
            <MobileCompactCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              appointments={appointments}
            />
          </div>
          
          {/* Visualização de 3 dias */}
          <div className="mobile-spacing">
            <MobileThreeDaysView
              appointments={appointments}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onUpdateAppointment={onUpdateAppointment}
              onEditAppointment={handleEditAppointment}
              onDeleteAppointment={onDeleteAppointment}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      </PullToRefreshContainer>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => setShowCreateWizard(true)}
        className="safe-area-bottom shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </FloatingActionButton>

      {/* Modal do Wizard */}
      <CreateAppointmentWizard
        isOpen={showCreateWizard}
        onClose={handleCloseWizard}
        editingAppointment={editingAppointment}
      />
    </div>
  );
};