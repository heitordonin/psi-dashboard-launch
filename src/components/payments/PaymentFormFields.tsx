
import { PatientAndPayer } from './PatientAndPayer';
import { ReceivedCheckbox } from './ReceivedCheckbox';
import { PaymentDescriptionField } from './PaymentDescriptionField';
import { PaymentAmountField } from './PaymentAmountField';
import { PaymentDueDateField } from './PaymentDueDateField';
import { validateCPF, validateCNPJ } from '@/utils/securityValidation';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { isDemoUser } from '@/utils/demoUser';
import type { Patient } from '@/types/patient';

interface FormData {
  patient_id: string;
  amount: number;
  due_date: string;
  description: string;
  payer_cpf: string;
}

interface PaymentFormFieldsProps {
  patients: Patient[];
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  paymentTitular: 'patient' | 'other';
  setPaymentTitular: (value: 'patient' | 'other') => void;
  isReceived: boolean;
  setIsReceived: (value: boolean) => void;
  receivedDate: string;
  setReceivedDate: (value: string) => void;
  isEditing: boolean;
  originalPaidDate?: string;
}

export function PaymentFormFields({
  patients,
  formData,
  setFormData,
  paymentTitular,
  setPaymentTitular,
  isReceived,
  setIsReceived,
  receivedDate,
  setReceivedDate,
  isEditing,
  originalPaidDate
}: PaymentFormFieldsProps) {
  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  
  // Função de validação baseada no tipo de paciente
  const validateDocument = (document: string): boolean => {
    if (!selectedPatient || selectedPatient.is_payment_from_abroad) {
      return true; // Não validar documentos para pacientes do exterior
    }
    
    if (selectedPatient.patient_type === 'company') {
      return validateCNPJ(document);
    } else {
      return validateCPF(document);
    }
  };

  return (
    <div className="space-y-6">
      <PatientAndPayer
        patients={patients}
        formData={formData}
        setFormData={setFormData}
        paymentTitular={paymentTitular}
        setPaymentTitular={setPaymentTitular}
        payerCpf={formData.payer_cpf}
        setPayerCpf={(cpf) => setFormData(prev => ({ ...prev, payer_cpf: cpf }))}
        errors={{}}
        validateCpf={validateDocument}
      />

      <ReceivedCheckbox
        isAlreadyReceived={isReceived}
        setIsAlreadyReceived={setIsReceived}
        receivedDate={receivedDate}
        setReceivedDate={setReceivedDate}
        errors={{}}
        isEditing={isEditing}
        originalPaidDate={originalPaidDate}
      />
      
      <PaymentDueDateField
        value={formData.due_date}
        onChange={(value) => setFormData((prev) => ({ ...prev, due_date: value }))}
        isReceived={isReceived}
      />
      
      <PaymentAmountField
        value={formData.amount}
        onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
      />

      <PaymentDescriptionField
        value={formData.description}
        onChange={(description) => setFormData(prev => ({ ...prev, description }))}
      />
    </div>
  );
}
