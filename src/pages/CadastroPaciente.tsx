
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Step2_PersonalData } from '@/components/patients/wizard/Step2_PersonalData';
import { Step3_Address } from '@/components/patients/wizard/Step3_Address';
import { Step4_Options } from '@/components/patients/wizard/Step4_Options';
import { supabase } from '@/integrations/supabase/client';

interface PatientWizardData {
  // Personal data
  full_name: string;
  patient_type: "individual" | "company";
  cpf: string;
  cnpj: string;
  email: string;
  phone: string;
  
  // Address data
  zip_code: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  
  // Options
  has_financial_guardian: boolean;
  guardian_cpf: string;
  is_payment_from_abroad: boolean;
}

const CadastroPaciente = () => {
  const [searchParams] = useSearchParams();
  const [validationState, setValidationState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PatientWizardData>({
    full_name: '',
    patient_type: 'individual',
    cpf: '',
    cnpj: '',
    email: '',
    phone: '',
    zip_code: '',
    street: '',
    street_number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    has_financial_guardian: false,
    guardian_cpf: '',
    is_payment_from_abroad: false,
  });

  const token = searchParams.get('token');
  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationState('invalid');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('validate-patient-invite', {
          body: { token }
        });

        if (error) {
          console.error('Error validating token:', error);
          setValidationState('invalid');
          return;
        }

        if (data?.success) {
          setValidationState('valid');
        } else {
          setValidationState('invalid');
        }
      } catch (error) {
        console.error('Unexpected error validating token:', error);
        setValidationState('invalid');
      }
    };

    validateToken();
  }, [token]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (updates: Partial<PatientWizardData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleFinalSubmit = () => {
    console.log('Patient registration data:', formData);
    console.log('Token:', token);
    // TODO: Implement final submission logic
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step2_PersonalData
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={() => {}} // No previous on first step
          />
        );
      case 2:
        return (
          <Step3_Address
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <Step4_Options
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleFinalSubmit}
            onPrevious={handlePrevious}
          />
        );
      default:
        return null;
    }
  };

  if (validationState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validationState === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Convite Inválido</h2>
            <p className="text-gray-600 mb-4">
              Link de convite inválido ou expirado. Por favor, solicite um novo link ao seu psicólogo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Voltar
              </Button>
              <Button type="button" onClick={handleFinalSubmit} className="bg-green-600 hover:bg-green-700">
                Finalizar Cadastro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroPaciente;
