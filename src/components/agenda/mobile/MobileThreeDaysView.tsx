import { format, addDays, isSameDay, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";
import { Appointment } from "@/types/appointment";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { cn } from "@/lib/utils";
import { DeleteAppointmentModal } from "../DeleteAppointmentModal";
import { useState } from "react";

interface MobileThreeDaysViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onUpdateAppointment: (appointmentId: string, status: Appointment['status']) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
  isDeleting?: boolean;
}

export const MobileThreeDaysView = ({
  appointments,
  selectedDate,
  onDateSelect,
  onUpdateAppointment,
  onEditAppointment,
  onDeleteAppointment,
  isDeleting = false
}: MobileThreeDaysViewProps) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);
  
  const threeDays = [today, tomorrow, dayAfterTomorrow];

  const { elementRef } = useSwipeGesture({
    onSwipeLeft: () => {
      // Avançar 3 dias
      const newDate = addDays(threeDays[0], 3);
      onDateSelect(newDate);
    },
    onSwipeRight: () => {
      // Voltar 3 dias
      const newDate = addDays(threeDays[0], -3);
      onDateSelect(newDate);
    },
    threshold: 100
  });

  const getAppointmentsForDay = (date: Date) => {
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.start_datetime);
        return isSameDay(aptDate, date);
      })
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
      .slice(0, 3); // Máximo 3 por dia para não sobrecarregar
  };

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "EEE", { locale: ptBR });
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    onEditAppointment(appointment);
  };

  return (
    <div ref={elementRef} className="mobile-spacing">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Próximos Dias</h3>
        <Badge variant="outline" className="swipe-indicator">
          Deslize para navegar
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {threeDays.map(day => {
          const dayAppointments = getAppointmentsForDay(day);
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <Card 
              key={day.toISOString()}
              className={cn(
                "mobile-card cursor-pointer transition-colors hover:bg-accent touch-target-enhanced",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => onDateSelect(day)}
            >
              <CardContent className="p-2 h-32 flex flex-col">
                {/* Day Header */}
                <div className="text-center mb-2 flex-shrink-0">
                  <p className="text-sm font-medium text-primary">
                    {getDayLabel(day)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(day, "dd/MM", { locale: ptBR })}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {dayAppointments.length}
                  </Badge>
                </div>

                {/* Appointments */}
                <div className="flex-1 overflow-hidden">
                  {dayAppointments.length > 0 ? (
                    <div className="space-y-1 max-h-full overflow-y-auto">
                      {dayAppointments.map(apt => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentClick(apt);
                          }}
                          className="bg-muted/50 rounded p-1.5 hover:bg-accent transition-colors cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <Clock className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                            <span className="font-medium text-xs">
                              {format(new Date(apt.start_datetime), "HH:mm")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate leading-tight">
                            {apt.title}
                          </p>
                          {apt.patient_name && (
                            <p className="text-xs text-muted-foreground truncate leading-tight">
                              {apt.patient_name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground">Livre</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};