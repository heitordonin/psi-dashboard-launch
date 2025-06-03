
export interface Payment {
  id: string;
  patient_id: string;
  amount: number;
  due_date: string;
  status: 'draft' | 'pending' | 'paid' | 'failed';
  payment_url?: string;
  created_at: string;
}

export interface PaymentWithPatient extends Payment {
  patients: {
    full_name: string;
  };
}
