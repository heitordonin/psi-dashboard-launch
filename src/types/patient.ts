
export interface Patient {
  id: string;
  full_name: string;
  cpf: string;
  phone?: string;
  email?: string;
  guardian_cpf?: string;
  has_financial_guardian: boolean;
  is_payment_from_abroad: boolean;
  created_at: string;
  updated_at: string;
}
