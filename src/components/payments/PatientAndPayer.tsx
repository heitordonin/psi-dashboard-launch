
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

interface Patient {
  id: string;
  full_name: string;
  patient_type?: "individual" | "company";
  cpf?: string;
  cnpj?: string;
  guardian_cpf?: string;
  is_payment_from_abroad?: boolean;
}

interface PatientAndPayerProps {
  patients: Patient[];
  formData: {
    patient_id: string;
    amount: number;
    due_date: string;
    description: string;
    payer_cpf?: string;
  };
  setFormData: (data: any) => void;
  paymentTitular: 'patient' | 'other';
  setPaymentTitular: (value: 'patient' | 'other') => void;
  payerCpf: string;
  setPayerCpf: (value: string) => void;
  errors: Record<string, string>;
  validateCpf: (cpf: string) => boolean;
}

export const PatientAndPayer = ({
  patients,
  formData,
  setFormData,
  paymentTitular,
  setPaymentTitular,
  payerCpf,
  setPayerCpf,
  errors,
  validateCpf,
}: PatientAndPayerProps) => {
  const formatCpf = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  const isCompanyPatient = selectedPatient?.patient_type === 'company';

  const handlePatientChange = (patientId: string) => {
    setFormData({ ...formData, patient_id: patientId });
    const patient = patients.find(p => p.id === patientId);
    
    // Se for empresa, define automaticamente como 'patient' e limpa o CPF
    if (patient?.patient_type === 'company') {
      setPaymentTitular('patient');
      setPayerCpf('');
    } else if (patient?.guardian_cpf && paymentTitular === 'other') {
      setPayerCpf(patient.guardian_cpf);
    } else if (paymentTitular === 'other' && !patient?.guardian_cpf) {
      setPayerCpf('');
    }
  };

  const handleTitularChange = (value: 'patient' | 'other') => {
    setPaymentTitular(value);
    if (value === 'patient') {
      setPayerCpf('');
    } else if (value === 'other') {
      const selectedPatient = patients.find(p => p.id === formData.patient_id);
      if (selectedPatient?.guardian_cpf) {
        setPayerCpf(selectedPatient.guardian_cpf);
      }
    }
  };

  return (
    <>
      <div>
        <Label htmlFor="patient_id">Paciente *</Label>
        <Select
          value={formData.patient_id}
          onValueChange={handlePatientChange}
        >
          <SelectTrigger className={errors.patient_id ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecione um paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.patient_id && <p className="text-red-500 text-sm mt-1">{errors.patient_id}</p>}
      </div>

      {!isCompanyPatient && (
        <>
          <div>
            <Label>CPF do Titular *</Label>
            <RadioGroup
              value={paymentTitular}
              onValueChange={handleTitularChange}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patient" id="patient" />
                <Label htmlFor="patient">CPF do Paciente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Outro CPF</Label>
              </div>
            </RadioGroup>
          </div>

          {paymentTitular === 'other' && (
            <div>
              <Label htmlFor="payer_cpf">CPF do Titular *</Label>
              <Input
                id="payer_cpf"
                type="text"
                value={formatCpf(payerCpf)}
                onChange={(e) => setPayerCpf(e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
                className={errors.payerCpf ? 'border-red-500' : ''}
              />
              {errors.payerCpf && <p className="text-red-500 text-sm mt-1">{errors.payerCpf}</p>}
            </div>
          )}
        </>
      )}
    </>
  );
};
