import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageCircle } from "lucide-react";
import { AppointmentWizardStepProps } from "./types";
import { useAgendaSettings } from "@/hooks/useAgendaSettings";

export const WizardStep4Reminders = ({ formData, updateFormData }: AppointmentWizardStepProps) => {
  const { settings } = useAgendaSettings();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Lembretes</h2>
        <p className="text-sm text-muted-foreground">
          Configure os lembretes para este agendamento
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Mail className="mr-2 h-4 w-4" />
              Lembrete por E-mail
            </CardTitle>
            <CardDescription>
              {settings?.email_reminder_enabled && settings?.email_reminder_minutes
                ? `Será enviado ${settings.email_reminder_minutes} minutos antes do agendamento`
                : 'Configure os lembretes por e-mail nas configurações da agenda'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-reminder" className="text-sm font-normal">
                Enviar lembrete por e-mail
              </Label>
              <Switch
                id="email-reminder"
                checked={formData.send_email_reminder}
                onCheckedChange={(checked) => updateFormData({ send_email_reminder: checked })}
                disabled={!settings?.email_reminder_enabled || !formData.patient_email}
              />
            </div>
            {!formData.patient_email && (
              <p className="text-xs text-muted-foreground mt-2">
                E-mail do paciente necessário para enviar lembretes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <MessageCircle className="mr-2 h-4 w-4" />
              Lembrete por WhatsApp
            </CardTitle>
            <CardDescription>
              {settings?.whatsapp_reminder_enabled && settings?.whatsapp_reminder_minutes
                ? `Será enviado ${settings.whatsapp_reminder_minutes} minutos antes do agendamento`
                : 'Configure os lembretes por WhatsApp nas configurações da agenda'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="whatsapp-reminder" className="text-sm font-normal">
                Enviar lembrete por WhatsApp
              </Label>
              <Switch
                id="whatsapp-reminder"
                checked={formData.send_whatsapp_reminder}
                onCheckedChange={(checked) => updateFormData({ send_whatsapp_reminder: checked })}
                disabled={!settings?.whatsapp_reminder_enabled || !formData.patient_phone}
              />
            </div>
            {!formData.patient_phone && (
              <p className="text-xs text-muted-foreground mt-2">
                Telefone do paciente necessário para enviar lembretes
              </p>
            )}
          </CardContent>
        </Card>

        {(!settings?.email_reminder_enabled && !settings?.whatsapp_reminder_enabled) && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Configure os lembretes nas configurações da agenda para habilitar esta funcionalidade
            </p>
          </div>
        )}
      </div>
    </div>
  );
};