
import React, { useEffect } from 'react';
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

  // Auto-populate CPF/CNPJ when patient is selected
  useEffect(() => {
    if (formData.patient_id && selectedPatient) {
      if (selectedPatient.patient_type === 'company') {
        // For companies, use CNPJ
        if (selectedPatient.cnpj) {
          updateFormData({ payer_cpf: selectedPatient.cnpj });
        }
      } else {
        // For individuals, check who is paying
        if (formData.paymentTitular === 'patient' && selectedPatient.cpf) {
          updateFormData({ payer_cpf: selectedPatient.cpf });
        } else if (formData.paymentTitular === 'other' && selectedPatient.guardian_cpf) {
          updateFormData({ payer_cpf: selectedPatient.guardian_cpf });
        }
      }
    }
  }, [formData.patient_id, formData.paymentTitular, selectedPatient, updateFormData]);

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    
    updateFormData({
      patient_id: patientId,
      // Reset payer_cpf - it will be auto-populated by useEffect
      payer_cpf: '',
      // For companies, always is the company that pays
      paymentTitular: patient?.patient_type === 'company' ? 'patient' : 'patient'
    });
  };

  const handleDocumentChange = (value: string) => {
    if (isCompanyPatient) {
      // For company, apply CNPJ mask
      const formattedValue = formatCnpj(value);
      updateFormData({ payer_cpf: formattedValue });
    } else {
      // For individual, apply CPF mask
      const formattedValue = formatCpf(value);
      updateFormData({ payer_cpf: formattedValue });
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
    </div>
  );
}
