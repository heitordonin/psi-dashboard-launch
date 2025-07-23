import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/types/appointment";
import { AppointmentItem } from "./AppointmentItem";

interface AgendaCalendarViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
  onUpdateAppointment: (appointmentId: string, status: Appointment['status']) => void;
  onEditAppointment: (appointment: Appointment) => void;
}

const timeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

export const AgendaCalendarView = ({
  appointments,
  selectedDate,
  onDateSelect,
  viewMode,
  onViewModeChange,
  onUpdateAppointment,
  onEditAppointment
}: AgendaCalendarViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }));

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeek, i));
    }
    return days;
  };

  const getAppointmentsForSlot = (date: Date, time: string) => {
    console.log(`🔍 Filtering appointments for date: ${date.toDateString()}, time: ${time}`);
    console.log(`📅 Total appointments available:`, appointments.length);
    
    const filtered = appointments.filter(apt => {
      // Criar data do agendamento interpretando como UTC
      const aptDate = new Date(apt.start_datetime);
      
      // Verificar se é o mesmo dia no timezone local
      const isSameDate = isSameDay(aptDate, date);
      
      // Usar toLocaleTimeString para garantir timezone local consistente
      const aptTime = aptDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      const isSameTime = aptTime === time;
      
      console.log(`📋 Appointment ${apt.id}:`);
      console.log(`  - Original UTC: ${apt.start_datetime}`);
      console.log(`  - Local Date: ${aptDate.toLocaleDateString('pt-BR')}`);
      console.log(`  - Local Time: ${aptTime}`);
      console.log(`  - Target Date: ${date.toLocaleDateString('pt-BR')}`);
      console.log(`  - Target Time: ${time}`);
      console.log(`  - Same date: ${isSameDate}`);
      console.log(`  - Same time: ${isSameTime}`);
      console.log(`  - Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      console.log(`  - Will show: ${isSameDate && isSameTime}`);
      
      return isSameDate && isSameTime;
    });
    
    console.log(`✅ Filtered ${filtered.length} appointments for ${date.toDateString()} at ${time}`);
    return filtered;
  };

  const weekDays = getWeekDays();

  return (
    <div className="flex gap-6">
      {/* Mini Calendar Sidebar */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateSelect(date)}
              className="rounded-md border"
              locale={ptBR}
            />
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('week')}
                className="flex-1"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('month')}
                className="flex-1"
              >
                Mês
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar Grid */}
      <div className="flex-1">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {viewMode === 'week' ? 'Agenda Semanal' : 'Agenda Mensal'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium px-4">
                  {format(currentWeek, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'week' ? (
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header with weekdays */}
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    <div className="p-2 text-sm font-medium text-muted-foreground">Horário</div>
                    {weekDays.map(day => (
                      <div key={day.toISOString()} className="p-2 text-center">
                        <div className="text-sm font-medium">
                          {format(day, "EEE", { locale: ptBR })}
                        </div>
                        <div className={`text-lg ${isSameDay(day, selectedDate) ? 'text-primary font-bold' : ''}`}>
                          {format(day, "dd")}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time grid */}
                  <div className="space-y-1">
                    {timeSlots.map(time => (
                      <div key={time} className="grid grid-cols-8 gap-1">
                        <div className="p-2 text-sm text-muted-foreground border-r">
                          {time}
                        </div>
                        {weekDays.map(day => {
                          const appointments = getAppointmentsForSlot(day, time);
                          return (
                            <div key={`${day.toISOString()}-${time}`} className="p-1 min-h-[60px] border border-border/50 rounded">
                              {appointments.map(apt => (
                                <AppointmentItem
                                  key={apt.id}
                                  appointment={apt}
                                  onUpdateStatus={onUpdateAppointment}
                                  onEdit={onEditAppointment}
                                />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Visualização mensal em desenvolvimento</p>
                <p className="text-sm">Use a visualização semanal para ver os agendamentos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};