
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WizardFormData } from './types';
import type { Patient } from '@/types/patient';

interface PayerSummaryDisplayProps {
  formData: WizardFormData;
  selectedPatient: Patient | undefined;
}

export function PayerSummaryDisplay({ formData, selectedPatient }: PayerSummaryDisplayProps) {
  const getPayerInfo = () => {
    if (selectedPatient?.patient_type === 'company') {
      return formData.payer_cpf; // CNPJ
    }
    if (selectedPatient?.is_payment_from_abroad) {
      return formData.payer_cpf || 'Paciente do exterior';
    }
    return formData.payer_cpf;
  };

  const getPayerLabel = () => {
    if (selectedPatient?.patient_type === 'company') {
      return 'CNPJ do Pagador:';
    }
    if (selectedPatient?.is_payment_from_abroad) {
      return 'Documento do Pagador:';
    }
    return 'CPF do Pagador:';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dados do Pagador</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Paciente:</span>
          <span>{selectedPatient?.full_name}</span>
        </div>
        {!selectedPatient?.is_payment_from_abroad && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{getPayerLabel()}</span>
            <span>{getPayerInfo()}</span>
          </div>
        )}
        {formData.chargeType === 'link' && (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Notificação por Email:</span>
              <span>{formData.sendEmailNotification ? 'Sim' : 'Não'}</span>
            </div>
            {formData.sendEmailNotification && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span>{formData.email}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
