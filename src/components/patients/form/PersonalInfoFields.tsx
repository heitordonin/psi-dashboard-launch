
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCpf, formatCnpj, formatPhone } from '@/utils/inputFormatters';

interface PatientFormData {
  full_name: string;
  patient_type: "individual" | "company";
  cpf: string;
  cnpj: string;
  email: string;
  phone: string;
  has_financial_guardian: boolean;
  guardian_cpf: string;
  is_payment_from_abroad: boolean;
}

interface PersonalInfoFieldsProps {
  formData: PatientFormData;
  setFormData: React.Dispatch<React.SetStateAction<PatientFormData>>;
  errors: Record<string, string>;
  onPatientTypeChange: (isCompany: boolean) => void;
}

export const PersonalInfoFields = ({ 
  formData, 
  setFormData, 
  errors, 
  onPatientTypeChange 
}: PersonalInfoFieldsProps) => {
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formattedCpf }));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCnpj = formatCnpj(e.target.value);
    setFormData(prev => ({ ...prev, cnpj: formattedCnpj }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
  };

  return (
    <>
      <div>
        <Label htmlFor="full_name">Nome Completo *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="Nome completo do paciente/empresa"
          className={errors.full_name ? 'border-red-500' : ''}
        />
        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tipo de Cadastro</Label>
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${formData.patient_type === 'individual' ? 'font-medium' : 'text-gray-500'}`}>
              Pessoa Física
            </span>
            <Switch
              checked={formData.patient_type === 'company'}
              onCheckedChange={onPatientTypeChange}
            />
            <span className={`text-sm ${formData.patient_type === 'company' ? 'font-medium' : 'text-gray-500'}`}>
              Empresa
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_payment_from_abroad"
          checked={formData.is_payment_from_abroad}
          onCheckedChange={(checked) => setFormData(prev => ({ 
            ...prev, 
            is_payment_from_abroad: !!checked 
          }))}
        />
        <Label htmlFor="is_payment_from_abroad">Pagamento vem do exterior</Label>
      </div>

      {formData.patient_type === 'individual' && (
        <div>
          <Label htmlFor="cpf">
            CPF {!formData.is_payment_from_abroad && '*'}
          </Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={handleCpfChange}
            placeholder="000.000.000-00"
            maxLength={14}
            className={errors.cpf ? 'border-red-500' : ''}
            disabled={formData.is_payment_from_abroad}
          />
          {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
          {formData.is_payment_from_abroad && (
            <p className="text-sm text-gray-500 mt-1">CPF não é obrigatório para pagamentos do exterior</p>
          )}
        </div>
      )}

      {formData.patient_type === 'company' && (
        <div>
          <Label htmlFor="cnpj">
            CNPJ {!formData.is_payment_from_abroad && '*'}
          </Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={handleCnpjChange}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            className={errors.cnpj ? 'border-red-500' : ''}
            disabled={formData.is_payment_from_abroad}
          />
          {errors.cnpj && <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>}
          {formData.is_payment_from_abroad && (
            <p className="text-sm text-gray-500 mt-1">CNPJ não é obrigatório para pagamentos do exterior</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="email@exemplo.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={handlePhoneChange}
          placeholder="(11) 99999-9999"
          maxLength={15}
        />
      </div>
    </>
  );
};
