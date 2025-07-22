import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, User, Mail, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentWizardStepProps } from "./types";

export const WizardStep5Summary = ({ formData }: AppointmentWizardStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Resumo do Agendamento</h2>
        <p className="text-sm text-muted-foreground">
          Confira os dados antes de confirmar
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{formData.title}</p>
                <p className="text-sm text-muted-foreground">Título do agendamento</p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="mr-3 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(formData.start_datetime, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(formData.start_datetime, "HH:mm", { locale: ptBR })} às{" "}
                  {format(formData.end_datetime, "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            {formData.patient_name ? (
              <div className="flex items-center">
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formData.patient_name}</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {formData.patient_email && <p>E-mail: {formData.patient_email}</p>}
                    {formData.patient_phone && <p>Telefone: {formData.patient_phone}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum paciente selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lembretes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Lembrete por E-mail</span>
                </div>
                <Badge variant={formData.send_email_reminder ? "default" : "secondary"}>
                  {formData.send_email_reminder ? "Ativado" : "Desativado"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageCircle className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Lembrete por WhatsApp</span>
                </div>
                <Badge variant={formData.send_whatsapp_reminder ? "default" : "secondary"}>
                  {formData.send_whatsapp_reminder ? "Ativado" : "Desativado"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};