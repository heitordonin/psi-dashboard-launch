
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageCircle, Bell, Settings, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentWizardStepProps } from "./types";
import { useAgendaSettings } from "@/hooks/useAgendaSettings";

export const WizardStep4Reminders = ({ formData, updateFormData }: AppointmentWizardStepProps) => {
  const { settings } = useAgendaSettings();

  const hasPatientContact = formData.patient_email || formData.patient_phone;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Configurar Lembretes</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Configure os lembretes automáticos para este agendamento
        </p>
      </div>

      {!hasPatientContact && (
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Atenção:</strong> Para enviar lembretes, é necessário ter o e-mail ou telefone do paciente.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {/* Lembrete Imediato */}
        {hasPatientContact && (
          <Card className={cn(
            "transition-all duration-200",
            formData.send_immediate_reminder && hasPatientContact ? "border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800" : ""
          )}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    formData.send_immediate_reminder && hasPatientContact 
                      ? "bg-purple-100 text-purple-600" 
                      : "bg-gray-100 text-gray-500"
                  )}>
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Lembrete Imediato</CardTitle>
                    <CardDescription>
                      Enviado no momento da criação do agendamento
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={formData.send_immediate_reminder || false}
                  onCheckedChange={(checked) => updateFormData({ send_immediate_reminder: checked })}
                />
              </div>
            </CardHeader>
          </Card>
        )}

        <Card className={cn(
          "transition-all duration-200",
          formData.send_email_reminder && hasPatientContact ? "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800" : ""
        )}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  formData.send_email_reminder && hasPatientContact 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-gray-100 text-gray-500"
                )}>
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Lembrete por E-mail</CardTitle>
                  <CardDescription>
                    {settings?.email_reminder_enabled && settings?.email_reminder_minutes
                      ? `Enviado ${settings.email_reminder_minutes} minutos antes`
                      : 'Configure nas configurações da agenda'
                    }
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={formData.send_email_reminder}
                onCheckedChange={(checked) => updateFormData({ send_email_reminder: checked })}
                disabled={!settings?.email_reminder_enabled || !formData.patient_email}
              />
            </div>
          </CardHeader>
          
          {(!settings?.email_reminder_enabled || !formData.patient_email) && (
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {!settings?.email_reminder_enabled && (
                  <p>• Configure os lembretes por e-mail nas configurações da agenda</p>
                )}
                {!formData.patient_email && (
                  <p>• E-mail do paciente necessário para enviar lembretes</p>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <Card className={cn(
          "transition-all duration-200",
          formData.send_whatsapp_reminder && hasPatientContact ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" : ""
        )}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  formData.send_whatsapp_reminder && hasPatientContact 
                    ? "bg-green-100 text-green-600" 
                    : "bg-gray-100 text-gray-500"
                )}>
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Lembrete por WhatsApp</CardTitle>
                  <CardDescription>
                    {settings?.whatsapp_reminder_enabled && settings?.whatsapp_reminder_minutes
                      ? `Enviado ${settings.whatsapp_reminder_minutes} minutos antes`
                      : 'Configure nas configurações da agenda'
                    }
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={formData.send_whatsapp_reminder}
                onCheckedChange={(checked) => updateFormData({ send_whatsapp_reminder: checked })}
                disabled={!settings?.whatsapp_reminder_enabled || !formData.patient_phone}
              />
            </div>
          </CardHeader>
          
          {(!settings?.whatsapp_reminder_enabled || !formData.patient_phone) && (
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {!settings?.whatsapp_reminder_enabled && (
                  <p>• Configure os lembretes por WhatsApp nas configurações da agenda</p>
                )}
                {!formData.patient_phone && (
                  <p>• Telefone do paciente necessário para enviar lembretes</p>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {(!settings?.email_reminder_enabled && !settings?.whatsapp_reminder_enabled) && (
          <Card className="bg-muted/50 border-dashed border-2">
            <CardContent className="p-6 text-center">
              <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Configure os lembretes nas configurações da agenda para habilitar esta funcionalidade
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                asChild
              >
                <a href="/agenda/configuracoes" target="_blank">
                  Ir para Configurações
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {(formData.send_email_reminder || formData.send_whatsapp_reminder || formData.send_immediate_reminder) && hasPatientContact && (
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Lembretes configurados
                </span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                {formData.send_immediate_reminder && (
                  <p>✓ Lembrete imediato será enviado após a criação</p>
                )}
                {formData.send_email_reminder && formData.patient_email && (
                  <p>✓ E-mail será enviado para {formData.patient_email}</p>
                )}
                {formData.send_whatsapp_reminder && formData.patient_phone && (
                  <p>✓ WhatsApp será enviado para {formData.patient_phone}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
