import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/types/appointment";
import { AppointmentItem } from "./AppointmentItem";
import { useAgendaSettings } from "@/hooks/useAgendaSettings";
import { generateTimeSlots } from "@/utils/time";
import { isoToLocalHHMM, floorToStep, findHourSlot, calculatePositionInHour } from "@/utils/date";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileKPIsVertical } from "./mobile/MobileKPIsVertical";
import { MobileCompactCalendar } from "./mobile/MobileCompactCalendar";
import { MobileThreeDaysView } from "./mobile/MobileThreeDaysView";

interface AgendaCalendarViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
  onUpdateAppointment: (appointmentId: string, status: Appointment['status']) => void;
  onEditAppointment: (appointment: Appointment) => void;
}

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
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const { settings } = useAgendaSettings();
  const isMobile = useIsMobile();

  // Sincronizar currentWeek quando selectedDate mudar
  useEffect(() => {
    setCurrentWeek(startOfWeek(selectedDate, { weekStartsOn: 0 }));
  }, [selectedDate]);

  // Gerar hourSlots (grid visual de 1 hora) baseados nas configurações
  const getHourSlots = () => {
    const startHour = settings?.start_time ? parseInt(settings.start_time.split(':')[0]) : 7;
    const endHour = settings?.end_time ? parseInt(settings.end_time.split(':')[0]) : 19;
    
    return generateTimeSlots(startHour, endHour, 60); // Slots de 1 hora para a grade visual
  };

  const hourSlots = getHourSlots();


  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeek, i));
    }
    return days;
  };

  const getAppointmentsForSlot = (date: Date, hourSlot: string) => {
    console.log(`🔍 Filtering appointments for date: ${date.toDateString()}, hour: ${hourSlot}`);
    console.log(`📅 Total appointments available:`, appointments.length);
    
    const filtered = appointments.filter(apt => {
      // Criar data do agendamento interpretando como UTC
      const aptDate = new Date(apt.start_datetime);
      
      // Verificar se é o mesmo dia
      const isSameDate = isSameDay(aptDate, date);
      
      // Converter para timezone brasileiro
      const aptTime = isoToLocalHHMM(apt.start_datetime);
      
      // Arredondar para slot de 10 minutos e encontrar a hora correspondente
      const flooredTime = floorToStep(aptTime, 10);
      const appointmentHourSlot = findHourSlot(flooredTime, hourSlots);
      const isInSlot = appointmentHourSlot === hourSlot;
      
      console.log(`📋 Appointment ${apt.id}:`);
      console.log(`  - Original UTC: ${apt.start_datetime}`);
      console.log(`  - Local Time: ${aptTime}`);
      console.log(`  - Floored Time: ${flooredTime}`);
      console.log(`  - Hour Slot: ${appointmentHourSlot}`);
      console.log(`  - Target Hour: ${hourSlot}`);
      console.log(`  - Same date: ${isSameDate}`);
      console.log(`  - Is in slot: ${isInSlot}`);
      console.log(`  - Will show: ${isSameDate && isInSlot}`);
      
      return isSameDate && isInSlot;
    });
    
    console.log(`✅ Filtered ${filtered.length} appointments for ${date.toDateString()} at ${hourSlot}`);
    return filtered;
  };

  const weekDays = getWeekDays();

  // Mobile View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* KPIs Verticais */}
        <MobileKPIsVertical
          appointments={appointments}
          selectedDate={selectedDate}
        />
        
        {/* Calendário Compacto */}
        <MobileCompactCalendar
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          appointments={appointments}
        />
        
        {/* Visualização de 3 Dias */}
        <MobileThreeDaysView
          appointments={appointments}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onUpdateAppointment={onUpdateAppointment}
          onEditAppointment={onEditAppointment}
        />
      </div>
    );
  }

  // Desktop View
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

                  {/* Hour grid - Google Calendar style */}
                  <div className="space-y-1">
                    {hourSlots.map(hourSlot => (
                      <div key={hourSlot} className="grid grid-cols-8 gap-1">
                        <div className="p-2 text-sm text-muted-foreground border-r h-24 flex items-start">
                          {hourSlot}
                        </div>
                        {weekDays.map(day => {
                          const appointments = getAppointmentsForSlot(day, hourSlot);
                          return (
                            <div key={`${day.toISOString()}-${hourSlot}`} className="relative h-24 border border-border/50 rounded bg-card">
                              {appointments.map((apt, index) => {
                                const aptTime = isoToLocalHHMM(apt.start_datetime);
                                const aptEndTime = isoToLocalHHMM(apt.end_datetime);
                                const startDate = new Date(apt.start_datetime);
                                const endDate = new Date(apt.end_datetime);
                                const durationMinutes = Math.max(10, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)));
                                
                                const position = calculatePositionInHour(aptTime, durationMinutes);
                                
                                return (
                                  <AppointmentItem
                                    key={apt.id}
                                    appointment={apt}
                                    onUpdateStatus={onUpdateAppointment}
                                    onEdit={onEditAppointment}
                                    style={{
                                      position: 'absolute',
                                      top: position.top,
                                      height: position.height,
                                      left: `${index * 6}px`,
                                      right: `${index * 6}px`,
                                      zIndex: 10 + index
                                    }}
                                  />
                                );
                              })}
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