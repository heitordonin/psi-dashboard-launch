
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WizardFormData } from './types';
import type { Patient } from '@/types/patient';

interface WizardStep4Props {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  patients: Patient[];
}

export function WizardStep4PayerDetails({ formData, updateFormData, patients }: WizardStep4Props) {
  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  const getDocumentLabel = () => {
    if (!selectedPatient) return 'CPF:';
    if (selectedPatient.patient_type === 'company') return 'CNPJ:';
    if (selectedPatient.is_payment_from_abroad) return 'Documento:';
    return 'CPF:';
  };

  const getDocumentPlaceholder = () => {
    if (!selectedPatient) return 'Digite o CPF';
    if (selectedPatient.patient_type === 'company') return 'Digite o CNPJ';
    if (selectedPatient.is_payment_from_abroad) return 'Digite o documento (opcional)';
    return 'Digite o CPF';
  };

  const isDocumentRequired = () => {
    if (!selectedPatient) return true;
    // Pacientes do exterior não precisam de documento
    if (selectedPatient.is_payment_from_abroad) return false;
    // Empresas sempre precisam de CNPJ
    if (selectedPatient.patient_type === 'company') return true;
    // Pacientes individuais precisam de CPF se não for o próprio
    return formData.paymentTitular === 'other';
  };

  const shouldShowPaymentTitular = () => {
    if (!selectedPatient) return false;
    // Não mostrar para pacientes do exterior
    if (selectedPatient.is_payment_from_abroad) return false;
    // Não mostrar para empresas (sempre será "outro")
    if (selectedPatient.patient_type === 'company') return false;
    return true;
  };

  // Auto-ajustar paymentTitular baseado no tipo de paciente
  React.useEffect(() => {
    if (selectedPatient?.patient_type === 'company') {
      updateFormData({ paymentTitular: 'other' });
    } else if (selectedPatient?.is_payment_from_abroad) {
      updateFormData({ paymentTitular: 'patient' });
    }
  }, [selectedPatient, updateFormData]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Dados do Pagador</h3>
        
        <div className="space-y-4">
          {/* Seleção do Paciente */}
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente *</Label>
            <Select 
              value={formData.patient_id} 
              onValueChange={(value) => updateFormData({ patient_id: value, payer_cpf: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                    {patient.patient_type === 'company' && ' (Empresa)'}
                    {patient.is_payment_from_abroad && ' (Exterior)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quem vai pagar (apenas para pacientes individuais nacionais) */}
          {shouldShowPaymentTitular() && (
            <div className="space-y-3">
              <Label>Quem vai pagar?</Label>
              <RadioGroup
                value={formData.paymentTitular}
                onValueChange={(value) => updateFormData({ 
                  paymentTitular: value as 'patient' | 'other',
                  payer_cpf: value === 'patient' ? (selectedPatient?.cpf || '') : ''
                })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label htmlFor="patient">O próprio paciente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Responsável financeiro</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Campo de documento (CPF/CNPJ) */}
          {(formData.paymentTitular === 'other' || selectedPatient?.patient_type === 'company' || selectedPatient?.is_payment_from_abroad) && (
            <div className="space-y-2">
              <Label htmlFor="payer_cpf">
                {getDocumentLabel()}
                {isDocumentRequired() && ' *'}
              </Label>
              <Input
                id="payer_cpf"
                value={formData.payer_cpf}
                onChange={(e) => updateFormData({ payer_cpf: e.target.value })}
                placeholder={getDocumentPlaceholder()}
                required={isDocumentRequired()}
              />
            </div>
          )}

          {/* Opções de notificação por email (apenas para charges com link) */}
          {formData.chargeType === 'link' && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmailNotification"
                  checked={formData.sendEmailNotification}
                  onCheckedChange={(checked) => updateFormData({ sendEmailNotification: !!checked })}
                />
                <Label htmlFor="sendEmailNotification">Enviar notificação por email</Label>
              </div>

              {formData.sendEmailNotification && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email para notificação *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    placeholder="Digite o email"
                    required
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
