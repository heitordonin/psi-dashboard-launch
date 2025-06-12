
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePatientMutations } from '@/hooks/usePatientMutations';
import { Badge } from '@/components/ui/badge';

interface PatientWizardData {
  full_name: string;
  patient_type: "individual" | "company";
  cpf: string;
  cnpj: string;
  email: string;
  phone: string;
  zip_code: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  has_financial_guardian: boolean;
  guardian_cpf: string;
  is_payment_from_abroad: boolean;
}

interface Step5_SummaryProps {
  formData: PatientWizardData;
  onPrevious: () => void;
  onClose: () => void;
}

export const Step5_Summary = ({ 
  formData, 
  onPrevious, 
  onClose 
}: Step5_SummaryProps) => {
  const { user } = useAuth();
  const { createPatientMutation, isLoading } = usePatientMutations(user?.id, onClose);

  const handleSave = () => {
    createPatientMutation.mutate(formData);
  };

  const formatAddress = () => {
    const parts = [
      formData.street,
      formData.street_number,
      formData.complement,
      formData.neighborhood,
      formData.city,
      formData.state
    ].filter(Boolean);
    
    if (parts.length === 0) return 'Não informado';
    return parts.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Resumo do Cadastro</h3>
        <p className="text-gray-600">Revise as informações antes de salvar</p>
      </div>

      <div className="space-y-4">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Nome:</span>
              <span className="font-medium">{formData.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <Badge variant="outline">
                {formData.patient_type === 'individual' ? 'Pessoa Física' : 'Empresa'}
              </Badge>
            </div>
            {formData.patient_type === 'individual' && formData.cpf && (
              <div className="flex justify-between">
                <span className="text-gray-600">CPF:</span>
                <span className="font-medium">{formData.cpf}</span>
              </div>
            )}
            {formData.patient_type === 'company' && formData.cnpj && (
              <div className="flex justify-between">
                <span className="text-gray-600">CNPJ:</span>
                <span className="font-medium">{formData.cnpj}</span>
              </div>
            )}
            {formData.email && (
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{formData.email}</span>
              </div>
            )}
            {formData.phone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Telefone:</span>
                <span className="font-medium">{formData.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span className="text-gray-600">Endereço completo:</span>
              <span className="font-medium text-right flex-1 ml-2">{formatAddress()}</span>
            </div>
            {formData.zip_code && (
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">CEP:</span>
                <span className="font-medium">{formData.zip_code}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Pagamento do exterior:</span>
              <Badge variant={formData.is_payment_from_abroad ? "default" : "secondary"}>
                {formData.is_payment_from_abroad ? 'Sim' : 'Não'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Responsável financeiro:</span>
              <Badge variant={formData.has_financial_guardian ? "default" : "secondary"}>
                {formData.has_financial_guardian ? 'Sim' : 'Não'}
              </Badge>
            </div>
            {formData.has_financial_guardian && formData.guardian_cpf && (
              <div className="flex justify-between">
                <span className="text-gray-600">CPF do responsável:</span>
                <span className="font-medium">{formData.guardian_cpf}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Voltar
        </Button>
        <Button type="button" onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Paciente'}
        </Button>
      </div>
    </div>
  );
};
