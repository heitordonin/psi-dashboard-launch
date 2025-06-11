import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { WizardStep1PaymentType } from './wizard/WizardStep1PaymentType';
import { WizardStep2PaymentDetails } from './wizard/WizardStep2PaymentDetails';
import { WizardStep3FeesInterest } from './wizard/WizardStep3FeesInterest';
import { WizardStep4PayerDetails } from './wizard/WizardStep4PayerDetails';
import { WizardStep5Summary } from './wizard/WizardStep5Summary';
import { usePaymentData } from '@/hooks/usePaymentData';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import type { Patient } from '@/types/patient';

export interface WizardFormData {
  // Step 1: Payment type
  paymentType: 'single' | 'subscription';
  
  // Step 2: Payment details
  amount: number;
  due_date: string;
  description: string;
  paymentMethods: {
    boleto: boolean;
    creditCard: boolean;
  };
  
  // Step 3: Fees (future feature)
  monthlyInterest: number;
  lateFee: number;
  
  // Step 4: Payer details
  patient_id: string;
  paymentTitular: 'patient' | 'other';
  payer_cpf: string;
  sendEmailNotification: boolean;
  email: string;
  
  // Existing logic
  isReceived: boolean;
  receivedDate: string;
}

interface CreatePaymentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STEP_TITLES = [
  'Tipo de Cobrança',
  'Detalhes do Pagamento', 
  'Juros e Multa',
  'Dados do Pagador',
  'Resumo e Confirmação'
];

export function CreatePaymentWizard({ isOpen, onClose, onSuccess }: CreatePaymentWizardProps) {
  const { user } = useAuth();
  const { patients } = usePaymentData(user?.id);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({
    paymentType: 'single',
    amount: 0,
    due_date: '',
    description: '',
    paymentMethods: {
      boleto: true,
      creditCard: false
    },
    monthlyInterest: 0,
    lateFee: 0,
    patient_id: '',
    paymentTitular: 'patient',
    payer_cpf: '',
    sendEmailNotification: false,
    email: '',
    isReceived: false,
    receivedDate: ''
  });

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      paymentType: 'single',
      amount: 0,
      due_date: '',
      description: '',
      paymentMethods: { boleto: true, creditCard: false },
      monthlyInterest: 0,
      lateFee: 0,
      patient_id: '',
      paymentTitular: 'patient',
      payer_cpf: '',
      sendEmailNotification: false,
      email: '',
      isReceived: false,
      receivedDate: ''
    });
    onClose();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WizardStep1PaymentType
            selectedType={formData.paymentType}
            onSelect={(type) => updateFormData({ paymentType: type })}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <WizardStep2PaymentDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
          />
        );
      case 3:
        return (
          <WizardStep3FeesInterest
            monthlyInterest={formData.monthlyInterest}
            lateFee={formData.lateFee}
            updateFormData={updateFormData}
            onNext={nextStep}
          />
        );
      case 4:
        return (
          <WizardStep4PayerDetails
            formData={formData}
            updateFormData={updateFormData}
            patients={patients}
            onNext={nextStep}
          />
        );
      case 5:
        return (
          <WizardStep5Summary
            formData={formData}
            patients={patients}
            onSuccess={onSuccess}
            onClose={handleClose}
          />
        );
      default:
        return null;
    }
  };

  const progressPercentage = (currentStep / 5) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Nova Cobrança
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Etapa {currentStep} de 5</span>
              <span>{STEP_TITLES[currentStep - 1]}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </DialogHeader>

        <div className="py-6">
          {renderCurrentStep()}
        </div>

        {currentStep > 1 && currentStep < 5 && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
            
            <Button
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
