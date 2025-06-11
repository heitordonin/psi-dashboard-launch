
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { WizardFormData } from './types';
import type { Patient } from '@/types/patient';

interface WizardStep4Props {
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
}: WizardStep4Props) {
  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  const handleNext = () => {
    if (formData.patient_id && formData.payer_cpf) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Dados do Pagador</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="patient_id">Paciente *</Label>
            <Select
              value={formData.patient_id}
              onValueChange={(value) => {
                const patient = patients.find(p => p.id === value);
                updateFormData({
                  patient_id: value,
                  payer_cpf: patient?.cpf || ''
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um paciente" />
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

          <div>
            <Label>Quem irá pagar?</Label>
            <RadioGroup
              value={formData.paymentTitular}
              onValueChange={(value: 'patient' | 'other') => updateFormData({ paymentTitular: value })}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patient" id="patient" />
                <Label htmlFor="patient">O próprio paciente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Outra pessoa</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="payer_cpf">CPF do Pagador *</Label>
            <Input
              id="payer_cpf"
              value={formData.payer_cpf}
              onChange={(e) => updateFormData({ payer_cpf: e.target.value })}
              placeholder="000.000.000-00"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmailNotification"
                checked={formData.sendEmailNotification}
                onCheckedChange={(checked) => updateFormData({ sendEmailNotification: !!checked })}
              />
              <Label htmlFor="sendEmailNotification">Enviar notificação por email</Label>
            </div>

            {formData.sendEmailNotification && (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData({ email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleNext}
          disabled={!formData.patient_id || !formData.payer_cpf}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
