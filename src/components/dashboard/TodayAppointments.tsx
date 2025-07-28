import { Calendar, Clock, User, ArrowRight, Plus } from "lucide-react";
import { useMemo } from "react";
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
  
  // Estabilizar a data para evitar loops infinitos
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // Normalizar para início do dia
    return date;
  }, []);
  
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
          <div className="text-center py-8">
            <div className="rounded-full bg-muted w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhum agendamento hoje</h3>
            <p className="text-muted-foreground mb-4">
              Aproveite o dia livre ou crie um novo agendamento
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/agenda")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Agendamento
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo visual do dia */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {upcomingCount}
                </div>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                  Agendados
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {completedCount}
                </div>
                <p className="text-sm text-green-600/80 dark:text-green-400/80">
                  Realizados
                </p>
              </div>
            </div>

            {/* Indicador de próximo agendamento */}
            {upcomingCount > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    Próximo agendamento hoje
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/agenda")}
                  className="text-xs"
                >
                  Ver detalhes
                </Button>
              </div>
            )}

            {/* Botão para ver agenda completa */}
            <Button
              variant="outline"
              onClick={() => navigate("/agenda")}
              className="w-full flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Ver Agenda Completa
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};