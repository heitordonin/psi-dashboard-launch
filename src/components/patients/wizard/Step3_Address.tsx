
import React from 'react';
import { Button } from '@/components/ui/button';
import { AddressForm } from '@/components/profile/AddressForm';
import { PatientWizardData } from './types';

interface Step3_AddressProps {
  formData: PatientWizardData;
  updateFormData: (updates: Partial<PatientWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const Step3_Address = ({ 
  formData, 
  updateFormData, 
  onNext, 
  onPrevious 
}: Step3_AddressProps) => {
  const addressData = {
    zip_code: formData.zip_code,
    street: formData.street,
    street_number: formData.street_number,
    complement: formData.complement,
    neighborhood: formData.neighborhood,
    city: formData.city,
    state: formData.state,
  };

  const setAddressData = (updater: (prev: typeof addressData) => typeof addressData) => {
    const updated = updater(addressData);
    updateFormData(updated);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Endereço</h3>
        <p className="text-gray-600">Preencha o endereço do paciente</p>
        <p className="text-sm text-muted-foreground mt-1">
          ℹ️ Todos os campos de endereço são opcionais
        </p>
      </div>

      <AddressForm 
        formData={addressData}
        setFormData={setAddressData}
      />

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Voltar
        </Button>
        <Button type="button" onClick={onNext}>
          Próximo
        </Button>
      </div>
    </div>
  );
};
