import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ArrowLeft, Clock, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { useAgendaSettings } from "@/hooks/useAgendaSettings";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { AgendaSettings } from "@/types/appointment";

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'GMT-3 São Paulo' },
  { value: 'America/Rio_Branco', label: 'GMT-5 Rio Branco' },
  { value: 'America/Manaus', label: 'GMT-4 Manaus' },
  { value: 'America/Fortaleza', label: 'GMT-3 Fortaleza' },
  { value: 'America/Recife', label: 'GMT-3 Recife' },
];

const WORKING_DAYS = [
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

const REMINDER_MINUTES_OPTIONS = [
  { value: 5, label: '5 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 dia antes' },
];

export default function AgendaConfiguracoes() {
  const { user } = useSecureAuth();
  const { settings, saveSettings, isSaving } = useAgendaSettings();
  
  const [formData, setFormData] = useState<Partial<AgendaSettings>>({
    user_id: user?.id || '',
    start_time: '08:00',
    end_time: '18:00',
    session_duration: 50,
    working_days: [1, 2, 3, 4, 5],
    timezone: 'America/Sao_Paulo',
    google_calendar_integration: false,
    google_calendar_id: '',
    email_reminder_enabled: false,
    email_reminder_minutes: 60,
    whatsapp_reminder_enabled: false,
    whatsapp_reminder_minutes: 60,
    email_reminder_1_enabled: false,
    email_reminder_1_minutes: 60,
    email_reminder_2_enabled: false,
    email_reminder_2_minutes: 15,
    whatsapp_reminder_1_enabled: false,
    whatsapp_reminder_1_minutes: 60,
    whatsapp_reminder_2_enabled: false,
    whatsapp_reminder_2_minutes: 15,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        working_days: Array.isArray(settings.working_days) ? settings.working_days : [1, 2, 3, 4, 5],
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    saveSettings({
      ...formData,
      user_id: user.id,
    } as Omit<AgendaSettings, 'id' | 'created_at' | 'updated_at'>);
  };

  const handleWorkingDayChange = (dayId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      working_days: checked 
        ? [...(prev.working_days || []), dayId]
        : (prev.working_days || []).filter(id => id !== dayId)
    }));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <a href="/agenda">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Agenda
          </a>
        </Button>
        <h1 className="text-2xl font-bold">Configurações da Agenda</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Horários de Atendimento
            </CardTitle>
            <CardDescription>
              Configure seus horários de trabalho e duração das sessões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Horário de Início</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Horário de Término</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_duration">Duração da Sessão (minutos)</Label>
                <Input
                  id="session_duration"
                  type="number"
                  min="15"
                  max="240"
                  value={formData.session_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, session_duration: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Dias da Semana</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {WORKING_DAYS.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={(formData.working_days || []).includes(day.id)}
                      onCheckedChange={(checked) => handleWorkingDayChange(day.id, checked as boolean)}
                    />
                    <Label htmlFor={`day-${day.id}`} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fuso horário" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        {tz.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Lembretes por E-mail
            </CardTitle>
            <CardDescription>
              Configure até 2 lembretes automáticos por e-mail antes das consultas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Lembrete 1</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email_reminder_1_enabled"
                    checked={formData.email_reminder_1_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_reminder_1_enabled: checked }))}
                  />
                  <Label htmlFor="email_reminder_1_enabled">Ativado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-muted-foreground">Enviar</Label>
                  <Select
                    value={formData.email_reminder_1_minutes?.toString() || '60'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, email_reminder_1_minutes: parseInt(value) }))}
                    disabled={!formData.email_reminder_1_enabled}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Selecione o tempo" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_MINUTES_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Lembrete 2</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email_reminder_2_enabled"
                    checked={formData.email_reminder_2_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_reminder_2_enabled: checked }))}
                  />
                  <Label htmlFor="email_reminder_2_enabled">Ativado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-muted-foreground">Enviar</Label>
                  <Select
                    value={formData.email_reminder_2_minutes?.toString() || '15'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, email_reminder_2_minutes: parseInt(value) }))}
                    disabled={!formData.email_reminder_2_enabled}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Selecione o tempo" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_MINUTES_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Lembretes por WhatsApp
            </CardTitle>
            <CardDescription>
              Configure até 2 lembretes automáticos por WhatsApp antes das consultas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Lembrete 1</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="whatsapp_reminder_1_enabled"
                    checked={formData.whatsapp_reminder_1_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsapp_reminder_1_enabled: checked }))}
                  />
                  <Label htmlFor="whatsapp_reminder_1_enabled">Ativado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-muted-foreground">Enviar</Label>
                  <Select
                    value={formData.whatsapp_reminder_1_minutes?.toString() || '60'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, whatsapp_reminder_1_minutes: parseInt(value) }))}
                    disabled={!formData.whatsapp_reminder_1_enabled}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Selecione o tempo" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_MINUTES_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Lembrete 2</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="whatsapp_reminder_2_enabled"
                    checked={formData.whatsapp_reminder_2_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsapp_reminder_2_enabled: checked }))}
                  />
                  <Label htmlFor="whatsapp_reminder_2_enabled">Ativado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-muted-foreground">Enviar</Label>
                  <Select
                    value={formData.whatsapp_reminder_2_minutes?.toString() || '15'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, whatsapp_reminder_2_minutes: parseInt(value) }))}
                    disabled={!formData.whatsapp_reminder_2_enabled}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Selecione o tempo" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_MINUTES_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
              </form>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}