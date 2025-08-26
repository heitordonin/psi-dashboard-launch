
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Mail, MessageCircle, Bell, Settings, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentWizardStepProps } from "./types";
import { useAgendaSettings } from "@/hooks/useAgendaSettings";
import { useWhatsAppLimit } from "@/hooks/useWhatsAppLimit";

export const WizardStep4Reminders = ({ formData, updateFormData }: AppointmentWizardStepProps) => {
  const { settings } = useAgendaSettings();
  const { hasWhatsAppAccess, messagesRemaining, isLoading } = useWhatsAppLimit();

  const hasPatientContact = formData.patient_email || formData.patient_phone;
  
  // Verificar se pelo menos um lembrete de e-mail está habilitado
  const hasEmailRemindersEnabled = settings?.email_reminder_1_enabled || settings?.email_reminder_2_enabled || settings?.email_reminder_enabled;
  
  // Verificar se pelo menos um lembrete de WhatsApp está habilitado
  const hasWhatsAppRemindersEnabled = settings?.whatsapp_reminder_1_enabled || settings?.whatsapp_reminder_2_enabled || settings?.whatsapp_reminder_enabled;
  
  // Função para obter descrição dos lembretes de e-mail
  const getEmailReminderDescription = () => {
    const reminders = [];
    if (settings?.email_reminder_1_enabled && settings?.email_reminder_1_minutes) {
      reminders.push(`${settings.email_reminder_1_minutes}min`);
    }
    if (settings?.email_reminder_2_enabled && settings?.email_reminder_2_minutes) {
      reminders.push(`${settings.email_reminder_2_minutes}min`);
    }
    // Fallback para configuração antiga
    if (reminders.length === 0 && settings?.email_reminder_enabled && settings?.email_reminder_minutes) {
      reminders.push(`${settings.email_reminder_minutes}min`);
    }
    
    if (reminders.length === 0) return 'Configure nas configurações da agenda';
    if (reminders.length === 1) return `Enviado ${reminders[0]} antes`;
    return `${reminders.length} lembretes: ${reminders.join(' e ')} antes`;
  };
  
  // Função para obter descrição dos lembretes de WhatsApp
  const getWhatsAppReminderDescription = () => {
    const reminders = [];
    if (settings?.whatsapp_reminder_1_enabled && settings?.whatsapp_reminder_1_minutes) {
      reminders.push(`${settings.whatsapp_reminder_1_minutes}min`);
    }
    if (settings?.whatsapp_reminder_2_enabled && settings?.whatsapp_reminder_2_minutes) {
      reminders.push(`${settings.whatsapp_reminder_2_minutes}min`);
    }
    // Fallback para configuração antiga
    if (reminders.length === 0 && settings?.whatsapp_reminder_enabled && settings?.whatsapp_reminder_minutes) {
      reminders.push(`${settings.whatsapp_reminder_minutes}min`);
    }
    
    if (reminders.length === 0) return 'Configure nas configurações da agenda';
    if (reminders.length === 1) return `Enviado ${reminders[0]} antes`;
    return `${reminders.length} lembretes: ${reminders.join(' e ')} antes`;
  };

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
                    {getEmailReminderDescription()}
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={formData.send_email_reminder}
                onCheckedChange={(checked) => updateFormData({ send_email_reminder: checked })}
                disabled={!hasEmailRemindersEnabled || !formData.patient_email}
              />
            </div>
          </CardHeader>
          
          {(!hasEmailRemindersEnabled || !formData.patient_email) && (
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {!hasEmailRemindersEnabled && (
                  <p>• Configure os lembretes por e-mail nas configurações da agenda</p>
                )}
                {!formData.patient_email && (
                  <p>• E-mail do paciente necessário para enviar lembretes</p>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <TooltipProvider>
          <Card className={cn(
            "transition-all duration-200",
            formData.send_whatsapp_reminder && hasPatientContact ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" : "",
            !hasWhatsAppAccess ? "opacity-60" : ""
          )}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    formData.send_whatsapp_reminder && hasPatientContact && hasWhatsAppAccess
                      ? "bg-green-100 text-green-600" 
                      : "bg-gray-100 text-gray-500"
                  )}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Lembrete por WhatsApp</CardTitle>
                      {!hasWhatsAppAccess && !isLoading && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Disponível apenas nos planos pagos</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <CardDescription>
                      {!hasWhatsAppAccess 
                        ? "Disponível nos planos Gestão e Psi Regular" 
                        : getWhatsAppReminderDescription()
                      }
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={formData.send_whatsapp_reminder}
                  onCheckedChange={(checked) => updateFormData({ send_whatsapp_reminder: checked })}
                  disabled={!hasWhatsAppAccess || !hasWhatsAppRemindersEnabled || !formData.patient_phone}
                />
              </div>
            </CardHeader>
            
            {(!hasWhatsAppAccess || !hasWhatsAppRemindersEnabled || !formData.patient_phone) && (
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
                  {!hasWhatsAppAccess && (
                    <p>• <strong>Faça upgrade para um plano pago</strong> para habilitar lembretes WhatsApp</p>
                  )}
                  {hasWhatsAppAccess && !hasWhatsAppRemindersEnabled && (
                    <p>• Configure os lembretes por WhatsApp nas configurações da agenda</p>
                  )}
                  {hasWhatsAppAccess && !formData.patient_phone && (
                    <p>• Telefone do paciente necessário para enviar lembretes</p>
                  )}
                </div>
                {!hasWhatsAppAccess && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href="/plans" target="_blank">
                        Ver Planos
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </TooltipProvider>

        {(!hasEmailRemindersEnabled && !hasWhatsAppRemindersEnabled) && (
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
