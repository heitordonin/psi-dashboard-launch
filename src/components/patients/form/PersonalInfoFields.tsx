
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { PatientFormData } from '@/utils/patientFormValidation';
import { validateCPF, validateCNPJ, sanitizeTextInput } from '@/utils/securityValidation';

interface PersonalInfoFieldsProps {
  form: UseFormReturn<PatientFormData>;
  patientType: 'individual' | 'company';
  onPatientTypeChange: (type: 'individual' | 'company') => void;
}

export const PersonalInfoFields = ({ form, patientType, onPatientTypeChange }: PersonalInfoFieldsProps) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeTextInput(e.target.value, 100);
    form.setValue('full_name', sanitizedValue);
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    form.setValue('cpf', formatted);
    
    // Validate CPF in real-time
    if (value.length === 11) {
      const isValid = validateCPF(value);
      if (!isValid) {
        form.setError('cpf', { message: 'CPF inválido' });
      } else {
        form.clearErrors('cpf');
      }
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    form.setValue('cnpj', formatted);
    
    // Validate CNPJ in real-time
    if (value.length === 14) {
      const isValid = validateCNPJ(value);
      if (!isValid) {
        form.setError('cnpj', { message: 'CNPJ inválido' });
      } else {
        form.clearErrors('cnpj');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="patient_type">Tipo de Paciente</Label>
        <Select value={patientType} onValueChange={(value: 'individual' | 'company') => onPatientTypeChange(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Pessoa Física</SelectItem>
            <SelectItem value="company">Pessoa Jurídica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FormField
        control={form.control}
        name="full_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Completo</FormLabel>
            <FormControl>
              <Input
                {...field}
                onChange={handleNameChange}
                placeholder="Digite o nome completo"
                maxLength={100}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {patientType === 'individual' ? (
        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={handleCNPJChange}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
