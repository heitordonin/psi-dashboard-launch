
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

interface PatientTypeSectionProps {
  patientType: "individual" | "company";
  isPaymentFromAbroad: boolean;
  onPatientTypeChange: (isCompany: boolean) => void;
  onPaymentFromAbroadChange: (checked: boolean) => void;
}

export const PatientTypeSection = ({
  patientType,
  isPaymentFromAbroad,
  onPatientTypeChange,
  onPaymentFromAbroadChange
}: PatientTypeSectionProps) => {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tipo de Cadastro</Label>
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${patientType === 'individual' ? 'font-medium' : 'text-gray-500'}`}>
              Pessoa Física
            </span>
            <Switch
              checked={patientType === 'company'}
              onCheckedChange={onPatientTypeChange}
            />
            <span className={`text-sm ${patientType === 'company' ? 'font-medium' : 'text-gray-500'}`}>
              Empresa
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_payment_from_abroad"
          checked={isPaymentFromAbroad}
          onCheckedChange={(checked) => onPaymentFromAbroadChange(!!checked)}
        />
        <Label htmlFor="is_payment_from_abroad">Pagamento vem do exterior</Label>
      </div>
    </>
  );
};
