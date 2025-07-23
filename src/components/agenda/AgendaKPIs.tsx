import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/types/appointment";

interface AgendaKPIsProps {
  appointments: Appointment[];
  selectedDate: Date;
}

export const AgendaKPIs = ({ appointments, selectedDate }: AgendaKPIsProps) => {
  const todayAppointments = appointments?.filter(apt => {
    const aptDate = new Date(apt.start_datetime);
    return aptDate.toDateString() === selectedDate.toDateString();
  }) || [];

  const nextAppointment = todayAppointments
    .filter(apt => new Date(apt.start_datetime) > new Date())
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0];

  const thisMonthAppointments = appointments?.filter(apt => {
    const aptDate = new Date(apt.start_datetime);
    return aptDate.getMonth() === selectedDate.getMonth() && 
           aptDate.getFullYear() === selectedDate.getFullYear();
  }) || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center text-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground">{todayAppointments.length}</p>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center text-foreground">
            <Users className="mr-2 h-4 w-4" />
            Total de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground">{thisMonthAppointments.length}</p>
            <p className="text-sm text-muted-foreground">
              Este mês
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center text-foreground">
            <Clock className="mr-2 h-4 w-4" />
            Próxima Sessão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nextAppointment ? (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {format(new Date(nextAppointment.start_datetime), "HH:mm")}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {nextAppointment.title}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-muted-foreground">--:--</p>
                <p className="text-sm text-muted-foreground">
                  Nenhuma sessão agendada
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};