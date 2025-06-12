
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPhone } from '@/utils/inputFormatters';

interface ContactSectionProps {
  email: string;
  phone: string;
  errors: Record<string, string>;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
}

export const ContactSection = ({
  email,
  phone,
  errors,
  onEmailChange,
  onPhoneChange
}: ContactSectionProps) => {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    onPhoneChange(formattedPhone);
  };

  return (
    <>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="email@exemplo.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="(11) 99999-9999"
          maxLength={15}
        />
      </div>
    </>
  );
};
