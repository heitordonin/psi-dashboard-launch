
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCpf, formatCnpj } from '@/utils/inputFormatters';

interface DocumentSectionProps {
  patientType: "individual" | "company";
  cpf: string;
  cnpj: string;
  isPaymentFromAbroad: boolean;
  errors: Record<string, string>;
  onCpfChange: (cpf: string) => void;
  onCnpjChange: (cnpj: string) => void;
}

export const DocumentSection = ({
  patientType,
  cpf,
  cnpj,
  isPaymentFromAbroad,
  errors,
  onCpfChange,
  onCnpjChange
}: DocumentSectionProps) => {
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    onCpfChange(formattedCpf);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCnpj = formatCnpj(e.target.value);
    onCnpjChange(formattedCnpj);
  };

  if (patientType === 'individual') {
    return (
      <div>
        <Label htmlFor="cpf">
          CPF {!isPaymentFromAbroad && '*'}
        </Label>
        <Input
          id="cpf"
          value={cpf}
          onChange={handleCpfChange}
          placeholder="000.000.000-00"
          maxLength={14}
          className={errors.cpf ? 'border-red-500' : ''}
          disabled={isPaymentFromAbroad}
        />
        {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
        {isPaymentFromAbroad && (
          <p className="text-sm text-gray-500 mt-1">CPF não é obrigatório para pagamentos do exterior</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="cnpj">
        CNPJ {!isPaymentFromAbroad && '*'}
      </Label>
      <Input
        id="cnpj"
        value={cnpj}
        onChange={handleCnpjChange}
        placeholder="00.000.000/0000-00"
        maxLength={18}
        className={errors.cnpj ? 'border-red-500' : ''}
        disabled={isPaymentFromAbroad}
      />
      {errors.cnpj && <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>}
      {isPaymentFromAbroad && (
        <p className="text-sm text-gray-500 mt-1">CNPJ não é obrigatório para pagamentos do exterior</p>
      )}
    </div>
  );
};
