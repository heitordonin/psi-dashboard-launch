
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import { Step1_Choice } from './wizard/Step1_Choice';
import { Step2_PersonalData } from './wizard/Step2_PersonalData';
import { Step3_Address } from './wizard/Step3_Address';
import { Step4_Options } from './wizard/Step4_Options';
import { Step5_Summary } from './wizard/Step5_Summary';

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

interface CreatePatientWizardProps {
  onClose: () => void;
}

export const CreatePatientWizard = ({ onClose }: CreatePatientWizardProps) => {
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

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1_Choice onNext={handleNext} />;
      case 2:
        return (
          <Step2_PersonalData
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <Step3_Address
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <Step4_Options
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <Step5_Summary
            formData={formData}
            onPrevious={handlePrevious}
            onClose={onClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <CardTitle className="text-xl">Novo Paciente</CardTitle>
            <div className="mt-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-500 mt-1">
                Passo {currentStep} de {totalSteps}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};
