import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Clock, MapPin, Mail, MessageCircle, Calendar as CalendarIcon } from "lucide-react";
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
              Integração Google Calendar
            </CardTitle>
            <CardDescription>
              Sincronize seus agendamentos com o Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Ativar Integração</Label>
                <p className="text-sm text-muted-foreground">
                  Sincronizar agendamentos automaticamente
                </p>
              </div>
              <Switch
                checked={formData.google_calendar_integration}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, google_calendar_integration: checked }))}
              />
            </div>

            {formData.google_calendar_integration && (
              <div className="space-y-2">
                <Label htmlFor="google_calendar_id">ID do Calendário</Label>
                <Input
                  id="google_calendar_id"
                  type="text"
                  placeholder="seu-calendario@gmail.com"
                  value={formData.google_calendar_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_calendar_id: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre o ID nas configurações do seu calendário no Google Calendar
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Lembretes por E-mail
            </CardTitle>
            <CardDescription>
              Configure lembretes automáticos por e-mail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Ativar Lembretes por E-mail</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar lembretes automáticos para pacientes
                </p>
              </div>
              <Switch
                checked={formData.email_reminder_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_reminder_enabled: checked }))}
              />
            </div>

            {formData.email_reminder_enabled && (
              <div className="space-y-2">
                <Label htmlFor="email_reminder_minutes">Minutos antes do agendamento</Label>
                <Select
                  value={formData.email_reminder_minutes?.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, email_reminder_minutes: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="1440">1 dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              Lembretes por WhatsApp
            </CardTitle>
            <CardDescription>
              Configure lembretes automáticos por WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Ativar Lembretes por WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar lembretes automáticos para pacientes
                </p>
              </div>
              <Switch
                checked={formData.whatsapp_reminder_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsapp_reminder_enabled: checked }))}
              />
            </div>

            {formData.whatsapp_reminder_enabled && (
              <div className="space-y-2">
                <Label htmlFor="whatsapp_reminder_minutes">Minutos antes do agendamento</Label>
                <Select
                  value={formData.whatsapp_reminder_minutes?.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, whatsapp_reminder_minutes: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="1440">1 dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </form>
    </div>
  );
}