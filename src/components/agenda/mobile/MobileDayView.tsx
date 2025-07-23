import { format, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "@/types/appointment";
import { AppointmentItem } from "../AppointmentItem";
import { generateTimeSlots } from "@/utils/time";
import { isoToLocalHHMM, floorToStep, findHourSlot } from "@/utils/date";
import { useAgendaSettings } from "@/hooks/useAgendaSettings";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface MobileDayViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onUpdateAppointment: (appointmentId: string, status: Appointment['status']) => void;
  onEditAppointment: (appointment: Appointment) => void;
}

export const MobileDayView = ({
  appointments,
  selectedDate,
  onDateSelect,
  onUpdateAppointment,
  onEditAppointment
}: MobileDayViewProps) => {
  const { settings } = useAgendaSettings();

  const { elementRef } = useSwipeGesture({
    onSwipeLeft: () => onDateSelect(addDays(selectedDate, 1)),
    onSwipeRight: () => onDateSelect(addDays(selectedDate, -1)),
    threshold: 100
  });

  const getHourSlots = () => {
    const startHour = settings?.start_time ? parseInt(settings.start_time.split(':')[0]) : 7;
    const endHour = settings?.end_time ? parseInt(settings.end_time.split(':')[0]) : 19;
    return generateTimeSlots(startHour, endHour, 60);
  };

  const hourSlots = getHourSlots();

  const getAppointmentsForSlot = (hourSlot: string) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_datetime);
      const isSameDate = isSameDay(aptDate, selectedDate);
      
      if (!isSameDate) return false;
      
      const aptTime = isoToLocalHHMM(apt.start_datetime);
      const flooredTime = floorToStep(aptTime, 10);
      const appointmentHourSlot = findHourSlot(flooredTime, hourSlots);
      
      return appointmentHourSlot === hourSlot;
    });
  };

  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start_datetime);
    return isSameDay(aptDate, selectedDate);
  });

  return (
    <div ref={elementRef} className="space-y-4">
      {/* Day Header */}
      <div className="text-center p-4 bg-card rounded-lg">
        <h2 className="text-xl font-semibold">
          {format(selectedDate, "EEEE", { locale: ptBR })}
        </h2>
        <p className="text-lg text-muted-foreground">
          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </p>
        <Badge variant="outline" className="mt-2">
          {dayAppointments.length} agendamento{dayAppointments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Time Slots */}
      <div className="space-y-2">
        {hourSlots.map(hourSlot => {
          const slotAppointments = getAppointmentsForSlot(hourSlot);
          
          return (
            <Card key={hourSlot} className="min-h-[80px]">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="text-sm font-medium text-muted-foreground min-w-[60px]">
                    {hourSlot}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    {slotAppointments.length > 0 ? (
                      slotAppointments.map(apt => (
                        <AppointmentItem
                          key={apt.id}
                          appointment={apt}
                          onUpdateStatus={onUpdateAppointment}
                          onEdit={onEditAppointment}
                        />
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic py-2">
                        Horário livre
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};