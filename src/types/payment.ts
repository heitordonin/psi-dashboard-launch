
export interface Payment {
  id: string;
  patient_id: string;
  amount: number;
  due_date: string;
  description?: string;
  status: 'draft' | 'pending' | 'paid' | 'failed';
  payment_url?: string;
  paid_date?: string;
  payer_cpf?: string;
  guardian_name?: string;
  receita_saude_receipt_issued: boolean;
  email_reminder_sent_at?: string;
  created_at: string;
}

export interface PaymentWithPatient extends Payment {
  patients: {
    full_name: string;
    email?: string;
  };
}
