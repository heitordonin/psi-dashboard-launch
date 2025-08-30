import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle } from 'lucide-react';
import { Step2_PersonalData } from '@/components/patients/wizard/Step2_PersonalData';
import { Step3_Address } from '@/components/patients/wizard/Step3_Address';
import { Step4_Options } from '@/components/patients/wizard/Step4_Options';

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
  acceptedTerms: boolean;
}

interface CadastroPacienteFormProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
  formData: PatientWizardData;
  isSubmitting: boolean;
  ownerEmail: string | null;
  onNext: () => void;
  onPrevious: () => void;
  updateFormData: (updates: Partial<PatientWizardData>) => void;
  onFinalSubmit: () => void;
}

export const CadastroPacienteForm = ({
  currentStep,
  totalSteps,
  progress,
  formData,
  isSubmitting,
  ownerEmail,
  onNext,
  onPrevious,
  updateFormData,
  onFinalSubmit,
}: CadastroPacienteFormProps) => {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step2_PersonalData
            formData={formData}
            updateFormData={updateFormData}
            ownerEmail={ownerEmail}
            onNext={onNext}
            onPrevious={() => {}} // No previous on first step
          />
        );
      case 2:
        return (
          <Step3_Address
            formData={formData}
            updateFormData={updateFormData}
            onNext={onNext}
            onPrevious={onPrevious}
          />
        );
      case 3:
        return (
          <Step4_Options
            formData={formData}
            updateFormData={updateFormData}
            onNext={onFinalSubmit}
            onPrevious={onPrevious}
            isLastStep={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-xl">Cadastro de Paciente</CardTitle>
            <p className="text-gray-600 mt-2">
              Complete suas informações para finalizar o cadastro
            </p>
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-500 mt-1">
                Passo {currentStep} de {totalSteps}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStep()}
          {currentStep === totalSteps && (
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onPrevious} disabled={isSubmitting}>
                Voltar
              </Button>
              <Button 
                type="button" 
                onClick={onFinalSubmit} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  'Finalizar Cadastro'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};