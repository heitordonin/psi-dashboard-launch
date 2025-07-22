import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Settings, Clock, Users, ExternalLink } from "lucide-react";
import { CreateAppointmentWizard } from "@/components/agenda/CreateAppointmentWizard";
import { AgendaHeader } from "@/components/agenda/AgendaHeader";
import { useAppointments } from "@/hooks/useAppointments";
import { CalendarView } from "@/types/appointment";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Agenda() {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [currentView, setCurrentView] = useState<CalendarView>('week');
  const { appointments, isLoading } = useAppointments();

  const today = new Date();
  const todayAppointments = appointments?.filter(apt => {
    const aptDate = new Date(apt.start_datetime);
    return aptDate.toDateString() === today.toDateString();
  }) || [];

  return (
    <>
      <AgendaHeader onNewAppointment={() => setShowCreateWizard(true)} />
      
      <div className="container mx-auto p-6 space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{todayAppointments.length}</p>
              <p className="text-sm text-muted-foreground">
                {format(today, "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Total de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{appointments?.length || 0}</p>
              <p className="text-sm text-muted-foreground">
                Este mês
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Próxima Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayAppointments.length > 0 ? (
                <>
                  <p className="text-2xl font-bold">
                    {format(new Date(todayAppointments[0].start_datetime), "HH:mm")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {todayAppointments[0].title}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma sessão hoje
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Visualização do Calendário</span>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Calendário em desenvolvimento<br />
                <span className="text-sm">Visualização: {currentView}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              asChild
            >
              <a href="/agenda/sessoes-dia">
                <Users className="mr-2 h-4 w-4" />
                Ver Sessões do Dia
                <ExternalLink className="ml-auto h-4 w-4" />
              </a>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              asChild
            >
              <a href="/agenda/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Configurações da Agenda
                <ExternalLink className="ml-auto h-4 w-4" />
              </a>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Sincronizar Google Calendar
              <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled
            >
              <Clock className="mr-2 h-4 w-4" />
              Bloquear Horários
              <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {todayAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.slice(0, 3).map((appointment) => (
                <div 
                  key={appointment.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{appointment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.patient_name || 'Sem paciente'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {format(new Date(appointment.start_datetime), "HH:mm")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.end_datetime), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
              {todayAppointments.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <a href="/agenda/sessoes-dia">
                    Ver todos os {todayAppointments.length} agendamentos
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateAppointmentWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
      />
    </div>
    </>
  );
}