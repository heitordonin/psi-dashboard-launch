
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WizardFormData } from './types';
import type { Patient } from '@/types/patient';

interface WizardStep4Props {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  patients: Patient[];
}

export function WizardStep4PayerDetails({ formData, updateFormData, patients }: WizardStep4Props) {
  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  const isCompanyPatient = selectedPatient?.patient_type === 'company';
  const isFromAbroad = selectedPatient?.is_payment_from_abroad;

  const formatCpf = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    
    updateFormData({ 
      patient_id: patientId,
      email: patient?.email || ''
    });

    // Se for empresa, define automaticamente como 'patient' e usa CNPJ
    if (patient?.patient_type === 'company') {
      updateFormData({
        paymentTitular: 'patient',
        payer_cpf: patient?.cnpj || ''
      });
    } else if (patient?.is_payment_from_abroad) {
      // Para pacientes do exterior, limpa o CPF
      updateFormData({
        paymentTitular: 'patient',
        payer_cpf: ''
      });
    } else {
      // Para pacientes individuais, usa o CPF do paciente por padrão
      updateFormData({
        paymentTitular: 'patient',
        payer_cpf: patient?.cpf || ''
      });
    }
  };

  const handleTitularChange = (value: 'patient' | 'other') => {
    updateFormData({ paymentTitular: value });
    
    if (value === 'patient') {
      if (isCompanyPatient) {
        updateFormData({ payer_cpf: selectedPatient?.cnpj || '' });
      } else if (isFromAbroad) {
        updateFormData({ payer_cpf: '' });
      } else {
        updateFormData({ payer_cpf: selectedPatient?.cpf || '' });
      }
    } else {
      // Se escolheu "other", limpa o campo para o usuário preencher
      updateFormData({ payer_cpf: '' });
    }
  };

  const getDocumentLabel = () => {
    if (isCompanyPatient) return 'CNPJ';
    if (isFromAbroad) return 'Documento de Identificação';
    return 'CPF';
  };

  const getDocumentPlaceholder = () => {
    if (isCompanyPatient) return '00.000.000/0000-00';
    if (isFromAbroad) return 'Documento do exterior';
    return '000.000.000-00';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Dados do Pagador</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="patient">Paciente</Label>
            <Select value={formData.patient_id} onValueChange={handlePatientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                    {patient.patient_type === 'company' && ' (PJ)'}
                    {patient.is_payment_from_abroad && ' (Exterior)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Para pacientes do exterior ou empresas, não mostra opções de titular */}
          {!isFromAbroad && !isCompanyPatient && (
            <div>
              <Label>Titular do Pagamento</Label>
              <RadioGroup
                value={formData.paymentTitular}
                onValueChange={handleTitularChange}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label htmlFor="patient">CPF do Paciente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Outro CPF</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Campo do documento - só aparece se for "other" ou se não for do exterior */}
          {(formData.paymentTitular === 'other' || isCompanyPatient || (!isFromAbroad && formData.paymentTitular === 'patient')) && (
            <div>
              <Label htmlFor="payer_cpf">{getDocumentLabel()} do Pagador</Label>
              <Input
                id="payer_cpf"
                value={isCompanyPatient || isFromAbroad ? formData.payer_cpf : formatCpf(formData.payer_cpf)}
                onChange={(e) => updateFormData({ payer_cpf: e.target.value })}
                placeholder={getDocumentPlaceholder()}
                maxLength={isCompanyPatient ? 18 : (isFromAbroad ? 50 : 14)}
              />
              {formData.paymentTitular === 'other' && !isFromAbroad && (
                <p className="text-sm text-muted-foreground mt-1">
                  Pode ser diferente do CPF do paciente (ex: responsável financeiro)
                </p>
              )}
            </div>
          )}

          {/* Notificações section - now always shown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notificações</CardTitle>
              <CardDescription>
                Configure o envio de lembretes por email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmailNotification"
                  checked={formData.sendEmailNotification}
                  onCheckedChange={(checked) => updateFormData({ sendEmailNotification: !!checked })}
                />
                <Label htmlFor="sendEmailNotification">Enviar lembrete por email</Label>
              </div>

              {formData.sendEmailNotification && (
                <div>
                  <Label htmlFor="email">Email para notificação</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                  {selectedPatient?.email && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Email do paciente: {selectedPatient.email}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
