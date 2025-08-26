import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCpf } from '@/utils/inputFormatters';
import { validateCpf } from '@/utils/validators';
import { PatientWizardData } from './types';
import { TermsAcceptanceCheckbox } from '@/components/auth/TermsAcceptanceCheckbox';

interface Step4_OptionsProps {
  formData: PatientWizardData;
  updateFormData: (updates: Partial<PatientWizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLastStep?: boolean;
}

export const Step4_Options = ({ 
  formData, 
  updateFormData, 
  onNext, 
  onPrevious,
  isLastStep = false
}: Step4_OptionsProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGuardianCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    updateFormData({ guardian_cpf: formattedCpf });
  };

  const handleNext = () => {
    // Custom validation for this step only
    const stepErrors: Record<string, string> = {};
    
    if (formData.has_financial_guardian && formData.guardian_cpf) {
      if (!validateCpf(formData.guardian_cpf)) {
        stepErrors.guardian_cpf = 'CPF inválido';
      }
    } else if (formData.has_financial_guardian && !formData.guardian_cpf) {
      stepErrors.guardian_cpf = 'CPF do responsável é obrigatório';
    }

    // Validação dos termos de uso
    if (!formData.acceptedTerms) {
      stepErrors.acceptedTerms = 'Você deve aceitar os Termos de Uso para continuar';
    }

    setErrors(stepErrors);
    
    if (Object.keys(stepErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Opções Adicionais</h3>
        <p className="text-gray-600">Configure opções especiais para este paciente</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_payment_from_abroad"
            checked={formData.is_payment_from_abroad}
            onCheckedChange={(checked) => updateFormData({ 
              is_payment_from_abroad: !!checked 
            })}
          />
          <Label htmlFor="is_payment_from_abroad">Pagamento vem do exterior</Label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_financial_guardian"
              checked={formData.has_financial_guardian}
              onCheckedChange={(checked) => updateFormData({ 
                has_financial_guardian: !!checked,
                guardian_cpf: checked ? formData.guardian_cpf : ''
              })}
            />
            <Label htmlFor="has_financial_guardian">Tem responsável financeiro</Label>
          </div>

          {formData.has_financial_guardian && (
            <div>
              <Label htmlFor="guardian_cpf">CPF do Responsável *</Label>
              <Input
                id="guardian_cpf"
                value={formData.guardian_cpf}
                onChange={handleGuardianCpfChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className={errors.guardian_cpf ? 'border-red-500' : ''}
              />
              {errors.guardian_cpf && <p className="text-red-500 text-sm mt-1">{errors.guardian_cpf}</p>}
            </div>
          )}
        </div>

        <TermsAcceptanceCheckbox
          checked={formData.acceptedTerms}
          onChange={(checked) => updateFormData({ acceptedTerms: checked })}
          error={errors.acceptedTerms}
        />
      </div>

      {!isLastStep && (
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Voltar
          </Button>
          <Button type="button" onClick={handleNext}>
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
};
