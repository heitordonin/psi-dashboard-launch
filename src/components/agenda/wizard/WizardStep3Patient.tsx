import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, User, UserPlus, Users, UserX } from "lucide-react";
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
    setUseManualEntry(false);
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

  const handleSkipPatient = () => {
    setUseManualEntry(false);
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
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Informações do Paciente</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Selecione um paciente cadastrado ou preencha os dados manualmente
        </p>
      </div>

      <div className="space-y-4">
        {/* Opções de seleção */}
        {!selectedPatient && !useManualEntry && (
          <div className="grid gap-3">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <Popover open={showPatientSelect} onOpenChange={setShowPatientSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full h-auto p-0 justify-start"
                    >
                      <div className="flex items-center w-full">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium">Selecionar Paciente Cadastrado</p>
                          <p className="text-sm text-muted-foreground">
                            Escolha de {patients?.length || 0} pacientes
                          </p>
                        </div>
                        <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
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
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.patient_id === patient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
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
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:border-orange-300 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <Button
                  variant="ghost"
                  onClick={handleManualEntry}
                  className="w-full h-auto p-0 justify-start"
                >
                  <div className="flex items-center w-full">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                      <UserPlus className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">Preencher Dados Manualmente</p>
                      <p className="text-sm text-muted-foreground">
                        Para pacientes não cadastrados
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <Button
                  variant="ghost"
                  onClick={handleSkipPatient}
                  className="w-full h-auto p-0 justify-start"
                >
                  <div className="flex items-center w-full">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <UserX className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">Agendamento Sem Paciente</p>
                      <p className="text-sm text-muted-foreground">
                        Bloquear horário sem definir paciente
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paciente selecionado */}
        {selectedPatient && !useManualEntry && (
          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {selectedPatient.full_name}
                    </p>
                    <div className="text-sm text-green-600 space-y-1">
                      {selectedPatient.email && <p>{selectedPatient.email}</p>}
                      {selectedPatient.phone && <p>{selectedPatient.phone}</p>}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearPatient}
                >
                  Alterar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entrada manual */}
        {useManualEntry && (
          <Card className="border-orange-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <UserPlus className="w-4 h-4 mr-2 text-orange-600" />
                  Dados do Paciente
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearPatient}
                >
                  Cancelar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patient_name">Nome do Paciente *</Label>
                <Input
                  id="patient_name"
                  type="text"
                  placeholder="Nome completo do paciente"
                  value={formData.patient_name || ''}
                  onChange={(e) => updateFormData({ patient_name: e.target.value })}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient_email">E-mail</Label>
                  <Input
                    id="patient_email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.patient_email || ''}
                    onChange={(e) => updateFormData({ patient_email: e.target.value })}
                    className="border-orange-200 focus:border-orange-400"
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
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado vazio */}
        {!formData.patient_id && !useManualEntry && !formData.patient_name && (
          <Card className="bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <UserX className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Agendamento será criado sem vincular a um paciente específico
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};