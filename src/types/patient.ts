
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
  deleted_at?: string | null; // Nova coluna para soft delete
  owner_id?: string;
  // Address fields
  zip_code?: string;
  street?: string;
  street_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}
