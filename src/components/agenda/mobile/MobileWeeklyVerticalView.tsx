import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";
import { Appointment } from "@/types/appointment";
import { CompactAppointmentItem } from "./CompactAppointmentItem";

interface MobileWeeklyVerticalViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onUpdateAppointment: (id: string, status: Appointment['status']) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
  isDeleting?: boolean;
}

export const MobileWeeklyVerticalView = ({
  appointments,
  selectedDate,
  onDateSelect,
  onUpdateAppointment,
  onEditAppointment,
  onDeleteAppointment,
  isDeleting = false
}: MobileWeeklyVerticalViewProps) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getAppointmentsForDay = (date: Date) => {
    return appointments
      .filter(appointment => 
        isSameDay(new Date(appointment.start_datetime), date)
      )
      .sort((a, b) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );
  };

  const getDayLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (isSameDay(date, today)) return "Hoje";
    if (isSameDay(date, tomorrow)) return "Amanhã";
    
    return format(date, "EEE", { locale: ptBR });
  };

  return (
    <div className="mobile-spacing space-y-4">
      {weekDays.map((day) => {
        const dayAppointments = getAppointmentsForDay(day);
        const isSelected = isSameDay(day, selectedDate);
        
        return (
          <Card 
            key={day.toISOString()} 
            className={`${isSelected ? 'ring-2 ring-primary' : ''}`}
          >
            <CardHeader 
              className="pb-3 cursor-pointer touch-target-enhanced"
              onClick={() => onDateSelect(day)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">
                    {getDayLabel(day)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(day, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {dayAppointments.length} {dayAppointments.length === 1 ? 'sessão' : 'sessões'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {dayAppointments.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Livre</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayAppointments.map((appointment) => (
                    <CompactAppointmentItem
                      key={appointment.id}
                      appointment={appointment}
                      onEdit={onEditAppointment}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};