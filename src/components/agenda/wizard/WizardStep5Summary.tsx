import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Clock, User, Mail, MessageCircle, CheckCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentWizardStepProps } from "./types";

export const WizardStep5Summary = ({ formData }: AppointmentWizardStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Confirmar Agendamento</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Revise todas as informações antes de criar o agendamento
        </p>
      </div>

      <div className="space-y-4">
        {/* Resumo Principal */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-green-800 dark:text-green-200">
              <FileText className="w-5 h-5 mr-2" />
              {formData.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {format(formData.start_datetime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-green-600">
                  {format(formData.start_datetime, "HH:mm", { locale: ptBR })} às{" "}
                  {format(formData.end_datetime, "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Paciente */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center">
              <User className="w-4 h-4 mr-2" />
              Informações do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formData.patient_name ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nome:</span>
                  <span className="text-sm">{formData.patient_name}</span>
                </div>
                {formData.patient_email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">E-mail:</span>
                    <span className="text-sm">{formData.patient_email}</span>
                  </div>
                )}
                {formData.patient_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Telefone:</span>
                    <span className="text-sm">{formData.patient_phone}</span>
                  </div>
                )}
                {formData.patient_id && (
                  <Badge variant="secondary" className="text-xs">
                    Paciente Cadastrado
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Agendamento sem paciente específico
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações de Lembretes */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              Lembretes Configurados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(formData.send_email_reminder || formData.send_whatsapp_reminder) ? (
              <div className="space-y-3">
                {formData.send_email_reminder && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Lembrete por E-mail</span>
                    </div>
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      Ativo
                    </Badge>
                  </div>
                )}
                {formData.send_whatsapp_reminder && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Lembrete por WhatsApp</span>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Ativo
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum lembrete configurado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ação Final */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">
              Clique em "Confirmar" para criar o agendamento
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Você poderá editar essas informações depois se necessário
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};