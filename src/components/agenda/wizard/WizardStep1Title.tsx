
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { AppointmentWizardStepProps } from "./types";

export const WizardStep1Title = ({ formData, updateFormData }: AppointmentWizardStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Título do Agendamento</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Digite um título descritivo para identificar facilmente este agendamento
        </p>
      </div>

      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-medium">
              Título do agendamento *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Digite o título do agendamento..."
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              className="text-base border-primary/30 focus:border-primary"
              autoFocus
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
