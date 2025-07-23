
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Edit3 } from "lucide-react";
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
      for (let minute = 0; minute < 60; minute += 15) { // Alterado para 15 minutos
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
      } else {
        newStartDate.setHours(9, 0); // Default to 9:00 AM
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
    const newStartDate = new Date(formData.start_datetime || new Date());
    newStartDate.setHours(hours, minutes);
    
    const newEndDate = new Date(newStartDate);
    const sessionDuration = settings?.session_duration || 50;
    newEndDate.setMinutes(newEndDate.getMinutes() + sessionDuration);
    
    updateFormData({ 
      start_datetime: newStartDate,
      end_datetime: newEndDate
    });
  };

  const handleManualStartTimeChange = (timeValue: string) => {
    if (!timeValue || !formData.start_datetime) return;
    
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newStartDate = new Date(formData.start_datetime);
    newStartDate.setHours(hours, minutes);
    
    updateFormData({ start_datetime: newStartDate });
  };

  const handleManualEndTimeChange = (timeValue: string) => {
    if (!timeValue || !formData.start_datetime) return;
    
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newEndDate = new Date(formData.start_datetime);
    newEndDate.setHours(hours, minutes);
    
    // Validar se o horário final é após o inicial
    if (newEndDate > formData.start_datetime) {
      updateFormData({ end_datetime: newEndDate });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <CalendarIcon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Data e Horário</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Escolha a data e horário mais conveniente para o agendamento
        </p>
      </div>

      <div className="grid gap-4">
        {/* Seleção de Data */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Data do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !formData.start_datetime && "text-muted-foreground",
                    formData.start_datetime && "border-primary/50 bg-primary/5"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  {formData.start_datetime ? (
                    format(formData.start_datetime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
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
          </CardContent>
        </Card>

        {/* Seleção de Horário por Botões */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Horários Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
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
                  className="text-xs h-9 transition-all duration-200"
                >
                  {time}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edição Manual de Horários */}
        {formData.start_datetime && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Edit3 className="w-4 h-4 mr-2" />
                Ajustar Horários Manualmente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time" className="text-sm font-medium">
                    Horário de Início
                  </Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_datetime ? format(formData.start_datetime, "HH:mm") : ""}
                    onChange={(e) => handleManualStartTimeChange(e.target.value)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div>
                  <Label htmlFor="end_time" className="text-sm font-medium">
                    Horário de Término
                  </Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_datetime ? format(formData.end_datetime, "HH:mm") : ""}
                    onChange={(e) => handleManualEndTimeChange(e.target.value)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo do agendamento */}
        {formData.start_datetime && formData.end_datetime && (
          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Agendamento confirmado
                </span>
              </div>
              <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                <p>
                  <strong>Data:</strong> {format(formData.start_datetime, "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p>
                  <strong>Horário:</strong> {format(formData.start_datetime, "HH:mm")} às {" "}
                  {format(formData.end_datetime, "HH:mm")}
                </p>
                <p>
                  <strong>Duração:</strong> {Math.round((formData.end_datetime.getTime() - formData.start_datetime.getTime()) / (1000 * 60))} minutos
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
