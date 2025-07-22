import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AppointmentWizardStepProps } from "./types";

export const WizardStep1Title = ({ formData, updateFormData }: AppointmentWizardStepProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Título do Agendamento</h2>
        <p className="text-sm text-muted-foreground">
          Digite um título para identificar este agendamento
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          type="text"
          placeholder="Ex: Sessão de Terapia, Consulta Inicial..."
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className="w-full"
        />
      </div>
    </div>
  );
};