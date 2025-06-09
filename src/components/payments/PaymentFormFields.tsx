
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PatientAndPayer } from './PatientAndPayer';
import { ReceivedCheckbox } from './ReceivedCheckbox';
import { PaymentDescriptionField } from './PaymentDescriptionField';
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
  validateCpf: (cpf: string) => boolean;
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
  validateCpf
}: PaymentFormFieldsProps) {
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
        validateCpf={validateCpf}
      />

      <ReceivedCheckbox
        isAlreadyReceived={isReceived}
        setIsAlreadyReceived={setIsReceived}
        receivedDate={receivedDate}
        setReceivedDate={setReceivedDate}
        errors={{}}
        isEditing={isEditing}
      />
      
      {!isReceived && (
        <div className="space-y-2">
          <Label htmlFor="due_date">Data de Vencimento *</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, due_date: e.target.value }))
            }
            className="w-full"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="amount">Valor *</Label>
        <CurrencyInput
          value={formData.amount}
          onChange={(value) => {
            console.log('Currency input changed:', value);
            setFormData(prev => ({ ...prev, amount: value }));
          }}
          placeholder="R$ 0,00"
          className="w-full"
        />
      </div>

      <PaymentDescriptionField
        value={formData.description}
        onChange={(description) => setFormData(prev => ({ ...prev, description }))}
      />
    </div>
  );
}
