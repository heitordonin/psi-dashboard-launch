
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCpf, formatPhone } from '@/utils/inputFormatters';
import { SignupFormData } from './SignupFormValidation';

interface SignupFormFieldsProps {
  formData: SignupFormData;
  errors: Record<string, string>;
  onFieldChange: (field: keyof SignupFormData, value: string) => void;
}

export const SignupFormFields: React.FC<SignupFormFieldsProps> = ({
  formData,
  errors,
  onFieldChange,
}) => {
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    onFieldChange('cpf', formattedCpf);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    onFieldChange('phone', formattedPhone);
  };

  return (
    <>
      <div>
        <Label htmlFor="fullName">Nome Completo</Label>
        <Input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => onFieldChange('fullName', e.target.value)}
          placeholder="Seu nome completo"
          className={errors.fullName ? 'border-red-500' : ''}
        />
        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
      </div>

      <div>
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          type="text"
          value={formData.cpf}
          onChange={handleCpfChange}
          placeholder="000.000.000-00"
          maxLength={14}
          className={errors.cpf ? 'border-red-500' : ''}
        />
        {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Celular</Label>
        <div className="flex">
          <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">
            +55
          </div>
          <Input
            id="phone"
            type="text"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="(11) 99999-9999"
            maxLength={15}
            className={`rounded-l-none ${errors.phone ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onFieldChange('email', e.target.value)}
          placeholder="seu@email.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => onFieldChange('password', e.target.value)}
          placeholder="Sua senha"
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => onFieldChange('confirmPassword', e.target.value)}
          placeholder="Confirme sua senha"
          className={errors.confirmPassword ? 'border-red-500' : ''}
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
      </div>
    </>
  );
};
