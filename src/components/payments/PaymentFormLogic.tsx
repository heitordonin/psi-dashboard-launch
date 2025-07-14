import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PaymentFormFields } from './PaymentFormFields';
import { usePaymentMutations } from './PaymentFormMutations';
import { validatePaymentForm, sanitizePaymentFormData } from './PaymentFormValidation';
import type { Payment } from '@/types/payment';
import type { Patient } from '@/types/patient';

interface FormData {
  patient_id: string;
  amount: number;
  due_date: string;
  description: string;
  payer_cpf: string;
}

interface PaymentFormLogicProps {
  payment?: Payment;
  patients: Patient[];
  onSave?: (payment?: any) => void;
  onCancel?: () => void;
}

export function PaymentFormLogic({ payment, patients, onSave, onCancel }: PaymentFormLogicProps) {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    patient_id: payment?.patient_id || '',
    amount: payment?.amount || 0,
    due_date: payment?.due_date || '',
    description: payment?.description || '',
    payer_cpf: payment?.payer_cpf || '',
  });

  const [isReceived, setIsReceived] = useState(payment?.status === 'paid');
  const [receivedDate, setReceivedDate] = useState(payment?.paid_date || '');
  const [paymentTitular, setPaymentTitular] = useState<'patient' | 'other'>(
    payment?.payer_cpf ? 'other' : 'patient'
  );

  const { createPaymentMutation, updatePaymentMutation, isLoading } = usePaymentMutations(
    user?.id,
    onSave
  );

  // Initialize received date when isReceived changes to true
  useEffect(() => {
    if (isReceived && !receivedDate) {
      const today = new Date().toISOString().split('T')[0];
      setReceivedDate(today);
    }
  }, [isReceived, receivedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedPatient = patients.find(p => p.id === formData.patient_id);
  
    const validationError = validatePaymentForm(
      formData,
      isReceived,
      receivedDate,
      paymentTitular,
      selectedPatient
    );

    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Sanitizar dados antes de enviar
    const sanitizedFormData = sanitizePaymentFormData({
      patient_id: formData.patient_id,
      amount: formData.amount,
      due_date: isReceived ? (formData.due_date || receivedDate) : formData.due_date,
      description: formData.description,
      payer_cpf: formData.payer_cpf,
    });

    const mutationData = {
      formData: sanitizedFormData,
      isReceived,
      receivedDate,
      paymentTitular
    };
  
    if (payment) {
      updatePaymentMutation.mutate({
        ...mutationData,
        paymentId: payment.id
      });
    } else {
      createPaymentMutation.mutate(mutationData);
    }
  };

  return (
    <div className="form-step">
      <div className="form-step-content">
        <form onSubmit={handleSubmit} className="mobile-form-spacing">
          <PaymentFormFields
            patients={patients}
            formData={formData}
            setFormData={setFormData}
            paymentTitular={paymentTitular}
            setPaymentTitular={setPaymentTitular}
            isReceived={isReceived}
            setIsReceived={setIsReceived}
            receivedDate={receivedDate}
            setReceivedDate={setReceivedDate}
            isEditing={!!payment}
          />
        </form>
      </div>

      <div className="flex gap-3 pt-4 mt-auto">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 touch-target"
        >
          {isLoading 
            ? 'Salvando...' 
            : payment ? 'Atualizar' : 'Criar Cobrança'
          }
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="touch-target">
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
