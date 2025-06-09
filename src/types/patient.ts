
export interface Patient {
  id: string;
  full_name: string;
  cpf: string;
  cnpj?: string;
  patient_type?: "individual" | "company"; // Tornando opcional para compatibilidade com dados legados
  phone?: string;
  email?: string;
  guardian_cpf?: string;
  has_financial_guardian: boolean;
  is_payment_from_abroad: boolean;
  created_at?: string;
  updated_at?: string;
  owner_id?: string;
}
