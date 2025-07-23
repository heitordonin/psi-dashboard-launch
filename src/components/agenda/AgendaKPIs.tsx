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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-sm md:text-base flex items-center text-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1 md:space-y-2">
            <p className="text-xl md:text-2xl font-bold text-foreground">{todayAppointments.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-sm md:text-base flex items-center text-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Total de Agendamentos</span>
            <span className="sm:hidden">Total</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1 md:space-y-2">
            <p className="text-xl md:text-2xl font-bold text-foreground">{thisMonthAppointments.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Este mês
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-sm md:text-base flex items-center text-foreground">
            <Clock className="mr-2 h-4 w-4" />
            Próxima Sessão
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1 md:space-y-2">
            {nextAppointment ? (
              <>
                <p className="text-xl md:text-2xl font-bold text-foreground">
                  {format(new Date(nextAppointment.start_datetime), "HH:mm")}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {nextAppointment.title}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl md:text-2xl font-bold text-muted-foreground">--:--</p>
                <p className="text-xs md:text-sm text-muted-foreground">
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