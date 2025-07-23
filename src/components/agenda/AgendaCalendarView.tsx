import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { Appointment } from "@/types/appointment";
import { AppointmentItem } from "./AppointmentItem";
import { useAgendaSettings } from "@/hooks/useAgendaSettings";

interface AgendaCalendarViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
  onUpdateAppointment: (appointmentId: string, status: Appointment['status']) => void;
  onEditAppointment: (appointment: Appointment) => void;
}

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

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
  const { settings } = useAgendaSettings();

  // Gerar timeSlots dinâmicos baseados nas configurações
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = settings?.start_time ? parseInt(settings.start_time.split(':')[0]) : 7;
    const endHour = settings?.end_time ? parseInt(settings.end_time.split(':')[0]) : 19;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 10) { // Slots de 10 em 10 minutos
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Função para encontrar o slot mais próximo
  const findClosestSlot = (timeString: string, slots: string[]) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    let closestSlot = slots[0];
    let closestDiff = Infinity;
    
    for (const slot of slots) {
      const [slotHours, slotMinutes] = slot.split(':').map(Number);
      const slotInMinutes = slotHours * 60 + slotMinutes;
      const diff = Math.abs(timeInMinutes - slotInMinutes);
      
      if (diff < closestDiff) {
        closestDiff = diff;
        closestSlot = slot;
      }
    }
    
    return closestSlot;
  };

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
      
      // Verificar se é o mesmo dia no timezone brasileiro
      const isSameDate = isSameDay(aptDate, date);
      
      // Converter para timezone brasileiro usando date-fns-tz
      const aptTime = formatInTimeZone(aptDate, BRAZIL_TIMEZONE, 'HH:mm');
      
      // Encontrar o slot mais próximo ao invés de comparação exata
      const closestSlot = findClosestSlot(aptTime, timeSlots);
      const isInSlot = closestSlot === time;
      
      console.log(`📋 Appointment ${apt.id}:`);
      console.log(`  - Original UTC: ${apt.start_datetime}`);
      console.log(`  - Local Date: ${formatInTimeZone(aptDate, BRAZIL_TIMEZONE, 'dd/MM/yyyy')}`);
      console.log(`  - Local Time: ${aptTime}`);
      console.log(`  - Target Date: ${format(date, 'dd/MM/yyyy')}`);
      console.log(`  - Target Time: ${time}`);
      console.log(`  - Closest slot: ${closestSlot}`);
      console.log(`  - Same date: ${isSameDate}`);
      console.log(`  - Is in slot: ${isInSlot}`);
      console.log(`  - Will show: ${isSameDate && isInSlot}`);
      
      return isSameDate && isInSlot;
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