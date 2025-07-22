import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AppointmentWizardStepProps } from "./types";
import { useAgendaSettings } from "@/hooks/useAgendaSettings";

export const WizardStep2DateTime = ({ formData, updateFormData }: AppointmentWizardStepProps) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const { settings } = useAgendaSettings();

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = settings?.start_time ? parseInt(settings.start_time.split(':')[0]) : 8;
    const endHour = settings?.end_time ? parseInt(settings.end_time.split(':')[0]) : 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newStartDate = new Date(date);
      if (formData.start_datetime) {
        newStartDate.setHours(formData.start_datetime.getHours());
        newStartDate.setMinutes(formData.start_datetime.getMinutes());
      }
      
      const newEndDate = new Date(newStartDate);
      const sessionDuration = settings?.session_duration || 50;
      newEndDate.setMinutes(newEndDate.getMinutes() + sessionDuration);
      
      updateFormData({ 
        start_datetime: newStartDate,
        end_datetime: newEndDate
      });
    }
    setShowCalendar(false);
  };

  const handleTimeSelect = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newStartDate = new Date(formData.start_datetime);
    newStartDate.setHours(hours, minutes);
    
    const newEndDate = new Date(newStartDate);
    const sessionDuration = settings?.session_duration || 50;
    newEndDate.setMinutes(newEndDate.getMinutes() + sessionDuration);
    
    updateFormData({ 
      start_datetime: newStartDate,
      end_datetime: newEndDate
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Data e Horário</h2>
        <p className="text-sm text-muted-foreground">
          Selecione a data e horário do agendamento
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Data *</Label>
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.start_datetime && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_datetime ? (
                  format(formData.start_datetime, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                ) : (
                  "Selecione uma data"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.start_datetime}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Horário de Início *</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {timeSlots.map((time) => (
              <Button
                key={time}
                variant={
                  formData.start_datetime && 
                  format(formData.start_datetime, "HH:mm") === time 
                    ? "default" 
                    : "outline"
                }
                size="sm"
                onClick={() => handleTimeSelect(time)}
                className="text-xs"
              >
                <Clock className="w-3 h-3 mr-1" />
                {time}
              </Button>
            ))}
          </div>
        </div>

        {formData.start_datetime && formData.end_datetime && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Início:</strong> {format(formData.start_datetime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Término:</strong> {format(formData.end_datetime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Duração:</strong> {settings?.session_duration || 50} minutos
            </p>
          </div>
        )}
      </div>
    </div>
  );
};