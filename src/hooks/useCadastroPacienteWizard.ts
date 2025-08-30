import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  acceptedTerms: boolean;
}

export const useCadastroPacienteWizard = () => {
  const [searchParams] = useSearchParams();
  const [validationState, setValidationState] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
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
    acceptedTerms: false,
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
          // Store owner email for validation purposes
          setOwnerEmail(data.ownerEmail);
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

  const handleFinalSubmit = async () => {
    if (!token) {
      toast.error('Token não encontrado');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-patient-form', {
        body: { 
          formData,
          token 
        }
      });

      if (error) {
        console.error('Error submitting patient form:', error);
        toast.error('Erro ao enviar formulário. Tente novamente.');
        return;
      }

      if (data?.success) {
        // Salvar aceite dos termos após submissão bem-sucedida
        try {
          await supabase.functions.invoke('save-terms-acceptance', {
            body: {
              email: formData.email,
              formType: 'patient_signup'
            }
          });
        } catch (termsError) {
          console.error('Erro ao salvar aceite dos termos:', termsError);
          // Não falhar o processo por erro nos termos
        }

        toast.success('Cadastro realizado com sucesso!');
        setValidationState('success');
      } else {
        toast.error(data?.error || 'Erro ao processar cadastro');
      }
    } catch (error) {
      console.error('Unexpected error submitting form:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    validationState,
    currentStep,
    totalSteps,
    progress,
    formData,
    isSubmitting,
    ownerEmail,
    handleNext,
    handlePrevious,
    updateFormData,
    handleFinalSubmit,
  };
};