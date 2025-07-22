import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Settings, Clock } from "lucide-react";
import { CreateAppointmentWizard } from "@/components/agenda/CreateAppointmentWizard";
import { useAppointments } from "@/hooks/useAppointments";
import { CalendarView } from "@/types/appointment";

export default function Agenda() {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [currentView, setCurrentView] = useState<CalendarView>('week');
  const { appointments, isLoading } = useAppointments();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Psiclo Agenda</h1>
        <Button onClick={() => setShowCreateWizard(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <div className="flex gap-2">
        {(['month', 'week', 'day'] as CalendarView[]).map((view) => (
          <Button
            key={view}
            variant={currentView === view ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentView(view)}
          >
            {view === 'month' && 'Mês'}
            {view === 'week' && 'Semana'}
            {view === 'day' && 'Dia'}
          </Button>
        ))}
      </div>

      <div className="bg-card rounded-lg p-6">
        <p className="text-muted-foreground text-center">
          Calendário em desenvolvimento - {appointments?.length || 0} agendamentos
        </p>
      </div>

      <CreateAppointmentWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
      />
    </div>
  );
}