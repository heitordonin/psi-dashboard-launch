import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AgendaHeader } from "../AgendaHeader";
import { AgendaKPIs } from "../AgendaKPIs";
import { AgendaCalendarView } from "../AgendaCalendarView";
import { CreateAppointmentWizard } from "../CreateAppointmentWizard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Appointment } from "@/types/appointment";

interface DesktopAgendaLayoutProps {
  appointments: Appointment[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: 'week' | 'month';
  setViewMode: (mode: 'week' | 'month') => void;
  onUpdateAppointment: (appointmentId: string, status: Appointment['status']) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
  isDeleting?: boolean;
  isLoading?: boolean;
}

export const DesktopAgendaLayout = ({
  appointments,
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,
  onUpdateAppointment,
  onEditAppointment,
  onDeleteAppointment,
  isDeleting,
  isLoading
}: DesktopAgendaLayoutProps) => {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const queryClient = useQueryClient();

  const handleManualRefresh = async () => {
    console.log('🔄 Desktop refresh triggered');
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    await queryClient.refetchQueries({ queryKey: ['appointments'] });
  };

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
    <div className="min-h-screen bg-background">
      <AgendaHeader onNewAppointment={() => setShowCreateWizard(true)} />
      
      <div className="desktop-container">
        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
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
        
        {/* KPIs para Desktop */}
        <div className="mb-6">
          <AgendaKPIs 
            appointments={appointments || []} 
            selectedDate={selectedDate}
          />
        </div>
        
        {/* Calendar View */}
        <AgendaCalendarView
          appointments={appointments || []}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onUpdateAppointment={onUpdateAppointment}
          onEditAppointment={handleEditAppointment}
          onDeleteAppointment={onDeleteAppointment}
          isDeleting={isDeleting}
        />

        {/* Modal do Wizard */}
        <CreateAppointmentWizard
          isOpen={showCreateWizard}
          onClose={handleCloseWizard}
          editingAppointment={editingAppointment}
        />
      </div>
    </div>
  );
};