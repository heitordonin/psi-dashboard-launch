
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCpf } from '@/utils/inputFormatters';

interface PatientFormData {
  has_financial_guardian: boolean;
  guardian_cpf: string;
}

interface GuardianFieldsProps {
  formData: PatientFormData;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
}

export const GuardianFields = ({ formData, setFormData, errors }: GuardianFieldsProps) => {
  const handleGuardianCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    setFormData((prev: any) => ({ ...prev, guardian_cpf: formattedCpf }));
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="has_financial_guardian"
          checked={formData.has_financial_guardian}
          onCheckedChange={(checked) => setFormData((prev: any) => ({ 
            ...prev, 
            has_financial_guardian: !!checked,
            guardian_cpf: checked ? prev.guardian_cpf : ''
          }))}
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
    </>
  );
};
