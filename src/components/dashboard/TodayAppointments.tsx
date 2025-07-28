import { Calendar, Clock, User, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "@/hooks/useAppointments";
import { Skeleton } from "@/components/ui/skeleton";
import { isoToLocalHHMM } from "@/utils/date";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  scheduled: { label: 'Agendado', variant: 'default' as const },
  completed: { label: 'Realizado', variant: 'default' as const },
  no_show: { label: 'Faltou', variant: 'destructive' as const },
  cancelled: { label: 'Cancelado', variant: 'secondary' as const }
};

export const TodayAppointments = () => {
  const navigate = useNavigate();
  const today = new Date();
  
  const { appointments, isLoading } = useAppointments({
    date: today
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendamentos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const todaysAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_datetime);
    return appointmentDate.toDateString() === today.toDateString();
  });

  const upcomingCount = todaysAppointments.filter(apt => apt.status === 'scheduled').length;
  const completedCount = todaysAppointments.filter(apt => apt.status === 'completed').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendamentos de Hoje
            {todaysAppointments.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {todaysAppointments.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/agenda")}
            className="flex items-center gap-1"
          >
            Ver Agenda
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </CardHeader>
      <CardContent className="mobile-spacing">
        {todaysAppointments.length === 0 ? (
          <div className="text-center py-6">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-3">
              Nenhum agendamento para hoje
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/agenda")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Agendamento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Resumo do dia */}
            <div className="flex gap-4 text-sm text-muted-foreground border-b pb-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {upcomingCount} pendentes
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {completedCount} realizados
              </span>
            </div>

            {/* Lista de agendamentos */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todaysAppointments
                .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
                .map((appointment) => {
                  const startTime = isoToLocalHHMM(appointment.start_datetime);
                  const endTime = isoToLocalHHMM(appointment.end_datetime);
                  const statusInfo = statusConfig[appointment.status];

                  return (
                    <div
                      key={appointment.id}
                      onClick={() => navigate("/agenda")}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {startTime} - {endTime}
                            </span>
                            <Badge variant={statusInfo.variant} className="text-xs">
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="font-medium truncate text-sm">
                            {appointment.title}
                          </p>
                          {appointment.patient_name && (
                            <p className="text-sm text-muted-foreground truncate">
                              {appointment.patient_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};