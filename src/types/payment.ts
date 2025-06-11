
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
  pagarme_transaction_id?: string;
  pix_qr_code?: string;
  has_payment_link: boolean;
  created_at: string;
  owner_id: string;
}

export interface PaymentWithPatient extends Payment {
  patients?: {
    full_name: string;
    cpf?: string;
    phone?: string;
    email?: string;
  };
}

export interface AdminTransaction {
  id: string;
  status: 'draft' | 'pending' | 'paid' | 'failed';
  amount: number;
  created_at: string;
  due_date: string;
  paid_date?: string;
  owner_id: string;
  profiles: {
    full_name?: string;
    display_name?: string;
  } | null;
}
