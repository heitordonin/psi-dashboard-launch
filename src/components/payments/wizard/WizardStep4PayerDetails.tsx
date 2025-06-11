
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCpf, formatCnpj } from '@/utils/inputFormatters';
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
  const isCompanyPatient = selectedPatient?.patient_type === 'company';

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    
    updateFormData({
      patient_id: patientId,
      // Para empresas, usar CNPJ; para pessoas físicas, limpar o campo
      payer_cpf: patient?.patient_type === 'company' ? (patient.cnpj || '') : '',
      // Para empresas, sempre é a própria empresa que paga
      paymentTitular: patient?.patient_type === 'company' ? 'patient' : 'patient'
    });
  };

  const handleDocumentChange = (value: string) => {
    if (isCompanyPatient) {
      // Para empresa, aplicar máscara de CNPJ
      const formattedValue = formatCnpj(value);
      updateFormData({ payer_cpf: formattedValue });
    } else {
      // Para pessoa física, aplicar máscara de CPF
      const formattedValue = formatCpf(value);
      updateFormData({ payer_cpf: formattedValue });
    }
  };

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
              onValueChange={handlePatientChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name} {patient.patient_type === 'company' && '(Empresa)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isCompanyPatient && (
            <div>
              <Label>Quem irá pagar?</Label>
              <RadioGroup
                value={formData.paymentTitular}
                onValueChange={(value: 'patient' | 'other') => {
                  updateFormData({ paymentTitular: value });
                  if (value === 'patient') {
                    updateFormData({ payer_cpf: selectedPatient?.cpf || '' });
                  } else {
                    updateFormData({ payer_cpf: selectedPatient?.guardian_cpf || '' });
                  }
                }}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label htmlFor="patient">O próprio paciente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Outra pessoa (responsável)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div>
            <Label htmlFor="payer_document">
              {isCompanyPatient ? 'CNPJ da Empresa *' : 'CPF do Pagador *'}
            </Label>
            <Input
              id="payer_document"
              value={formData.payer_cpf}
              onChange={(e) => handleDocumentChange(e.target.value)}
              placeholder={isCompanyPatient ? '00.000.000/0000-00' : '000.000.000-00'}
              maxLength={isCompanyPatient ? 18 : 14}
              required
            />
            {isCompanyPatient && (
              <p className="text-xs text-muted-foreground mt-1">
                Para empresas, sempre utilizamos o CNPJ da empresa como pagador
              </p>
            )}
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
