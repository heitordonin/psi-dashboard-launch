import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCpf } from '@/utils/inputFormatters';
import { validateCpf } from '@/utils/validators';
import type { WizardFormData } from '../CreatePaymentWizard';
import type { Patient } from '@/types/patient';

interface WizardStep4PayerDetailsProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  patients: Patient[];
  onNext: () => void;
}

export function WizardStep4PayerDetails({ 
  formData, 
  updateFormData, 
  patients, 
  onNext 
}: WizardStep4PayerDetailsProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (formData.patient_id) {
      const patient = patients.find(p => p.id === formData.patient_id);
      setSelectedPatient(patient || null);
      
      if (patient?.email && formData.sendEmailNotification && !formData.email) {
        updateFormData({ email: patient.email });
      }
    }
  }, [formData.patient_id, patients, formData.sendEmailNotification, formData.email, updateFormData]);

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient || null);
    updateFormData({ 
      patient_id: patientId,
      email: patient?.email || ''
    });
  };

  const handleCpfChange = (value: string) => {
    const formattedCpf = formatCpf(value);
    updateFormData({ payer_cpf: formattedCpf });
  };

  const handleEmailToggle = (enabled: boolean) => {
    updateFormData({ 
      sendEmailNotification: enabled,
      email: enabled && selectedPatient?.email ? selectedPatient.email : ''
    });
  };

  const getPatientDocument = () => {
    if (!selectedPatient) return '';
    return selectedPatient.cpf || selectedPatient.cnpj || 'Não informado';
  };

  const isValid = () => {
    const hasPatient = !!formData.patient_id;
    const hasCpfIfNeeded = formData.paymentTitular === 'patient' || 
                          (formData.paymentTitular === 'other' && validateCpf(formData.payer_cpf));
    const hasEmailIfNeeded = !formData.sendEmailNotification || !!formData.email.trim();
    
    return hasPatient && hasCpfIfNeeded && hasEmailIfNeeded;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          Dados do Pagador
        </h2>
        <p className="text-gray-600">
          Selecione o paciente e configure as informações de cobrança
        </p>
      </div>

      <div className="space-y-6">
        {/* Patient Selection */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Paciente *</Label>
          <Select value={formData.patient_id} onValueChange={handlePatientSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um paciente..." />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Patient Document Display */}
        {selectedPatient && (
          <div className="space-y-2">
            <Label className="text-base font-medium">CPF/CNPJ do Paciente</Label>
            <Input
              value={getPatientDocument()}
              readOnly
              className="bg-gray-50"
            />
          </div>
        )}

        {/* Payment Titular */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Quem irá pagar? *</Label>
          <RadioGroup
            value={formData.paymentTitular}
            onValueChange={(value: 'patient' | 'other') => updateFormData({ paymentTitular: value })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="patient" id="patient" />
              <Label htmlFor="patient" className="cursor-pointer">
                O próprio paciente
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="cursor-pointer">
                Outra pessoa (informar CPF)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Other Payer CPF */}
        {formData.paymentTitular === 'other' && (
          <div className="space-y-2">
            <Label htmlFor="payer_cpf" className="text-base font-medium">
              CPF do Responsável pelo Pagamento *
            </Label>
            <Input
              id="payer_cpf"
              value={formData.payer_cpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              placeholder="000.000.000-00"
              className={validateCpf(formData.payer_cpf) || !formData.payer_cpf ? '' : 'border-red-500'}
            />
            {formData.payer_cpf && !validateCpf(formData.payer_cpf) && (
              <p className="text-red-500 text-sm">CPF inválido</p>
            )}
          </div>
        )}

        {/* Email Notification */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notification" className="text-base font-medium">
              Deseja enviar a cobrança por e-mail?
            </Label>
            <Switch
              id="email-notification"
              checked={formData.sendEmailNotification}
              onCheckedChange={handleEmailToggle}
            />
          </div>

          {formData.sendEmailNotification && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                E-mail para Envio *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                placeholder="email@exemplo.com"
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                O link de pagamento será enviado para este e-mail
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={onNext}
          disabled={!isValid()}
          className="px-8"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
