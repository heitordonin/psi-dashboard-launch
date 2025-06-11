
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    
    // Use CNPJ for company patients, CPF for individual patients
    const payerDocument = patient?.patient_type === 'company' 
      ? patient?.cnpj || '' 
      : patient?.cpf || '';
    
    updateFormData({ 
      patient_id: patientId,
      payer_cpf: payerDocument,
      email: patient?.email || ''
    });
  };

  const getDocumentLabel = () => {
    return selectedPatient?.patient_type === 'company' ? 'CNPJ do Pagador' : 'CPF do Pagador';
  };

  const getDocumentPlaceholder = () => {
    return selectedPatient?.patient_type === 'company' ? '00.000.000/0000-00' : '000.000.000-00';
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
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payer_cpf">{getDocumentLabel()}</Label>
            <Input
              id="payer_cpf"
              value={formData.payer_cpf}
              onChange={(e) => updateFormData({ payer_cpf: e.target.value })}
              placeholder={getDocumentPlaceholder()}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Pode ser diferente do {selectedPatient?.patient_type === 'company' ? 'CNPJ' : 'CPF'} do paciente (ex: responsável financeiro)
            </p>
          </div>

          {/* Only show email notification options for link charges */}
          {formData.chargeType === 'link' && (
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
          )}
        </div>
      </div>
    </div>
  );
}
