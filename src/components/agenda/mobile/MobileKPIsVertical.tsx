import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/types/appointment";

interface MobileKPIsVerticalProps {
  appointments: Appointment[];
  selectedDate: Date;
}

export const MobileKPIsVertical = ({ appointments, selectedDate }: MobileKPIsVerticalProps) => {
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
    <div className="space-y-3 mb-4">
      {/* Hoje */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Hoje</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">{todayAppointments.length}</p>
              <p className="text-xs text-muted-foreground">
                {format(selectedDate, "dd/MM", { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total do Mês */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">{thisMonthAppointments.length}</p>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próxima Sessão */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Próxima</span>
            </div>
            <div className="text-right">
              {nextAppointment ? (
                <>
                  <p className="text-lg font-bold text-foreground">
                    {format(new Date(nextAppointment.start_datetime), "HH:mm")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {nextAppointment.title}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-muted-foreground">--:--</p>
                  <p className="text-xs text-muted-foreground">Nenhuma</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};