import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, User, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentWizardStepProps } from "./types";
import { usePatientsData } from "@/hooks/usePatientsData";

export const WizardStep3Patient = ({ formData, updateFormData }: AppointmentWizardStepProps) => {
  const [showPatientSelect, setShowPatientSelect] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const { patients } = usePatientsData();

  const selectedPatient = patients?.find(p => p.id === formData.patient_id);

  const handlePatientSelect = (patient: any) => {
    updateFormData({
      patient_id: patient.id,
      patient_name: patient.full_name,
      patient_email: patient.email || '',
      patient_phone: patient.phone || '',
    });
    setShowPatientSelect(false);
  };

  const handleManualEntry = () => {
    setUseManualEntry(true);
    updateFormData({
      patient_id: undefined,
      patient_name: '',
      patient_email: '',
      patient_phone: '',
    });
  };

  const handleClearPatient = () => {
    setUseManualEntry(false);
    updateFormData({
      patient_id: undefined,
      patient_name: '',
      patient_email: '',
      patient_phone: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Paciente</h2>
        <p className="text-sm text-muted-foreground">
          Selecione um paciente ou preencha manualmente (opcional)
        </p>
      </div>

      <div className="space-y-4">
        {!useManualEntry && !formData.patient_id && (
          <div className="space-y-3">
            <Label>Selecionar Paciente</Label>
            <Popover open={showPatientSelect} onOpenChange={setShowPatientSelect}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={showPatientSelect}
                  className="w-full justify-between"
                >
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {selectedPatient ? selectedPatient.full_name : "Selecione um paciente..."}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar paciente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {patients?.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={patient.full_name}
                          onSelect={() => handlePatientSelect(patient)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.patient_id === patient.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div>
                            <p className="font-medium">{patient.full_name}</p>
                            {patient.email && (
                              <p className="text-sm text-muted-foreground">{patient.email}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleManualEntry}
                className="text-sm"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Ou preencher manualmente
              </Button>
            </div>
          </div>
        )}

        {selectedPatient && !useManualEntry && (
          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedPatient.full_name}</p>
                  {selectedPatient.email && (
                    <p className="text-sm text-muted-foreground">{selectedPatient.email}</p>
                  )}
                  {selectedPatient.phone && (
                    <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearPatient}
                >
                  Alterar
                </Button>
              </div>
            </div>
          </div>
        )}

        {useManualEntry && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Informações do Paciente</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearPatient}
              >
                Cancelar
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="patient_name">Nome</Label>
                <Input
                  id="patient_name"
                  type="text"
                  placeholder="Nome do paciente"
                  value={formData.patient_name || ''}
                  onChange={(e) => updateFormData({ patient_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="patient_email">E-mail</Label>
                <Input
                  id="patient_email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.patient_email || ''}
                  onChange={(e) => updateFormData({ patient_email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="patient_phone">Telefone</Label>
                <Input
                  id="patient_phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.patient_phone || ''}
                  onChange={(e) => updateFormData({ patient_phone: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {!formData.patient_id && !useManualEntry && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Este agendamento será criado sem vincular a um paciente específico
            </p>
          </div>
        )}
      </div>
    </div>
  );
};