export interface AdminDocument {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  due_date: string;
  competency: string;
  status: 'pending' | 'paid' | 'overdue';
  file_path: string;
  paid_date: string | null;
  penalty_amount: number;
  created_at: string;
  updated_at: string;
  marked_as_paid_at: string | null;
  created_by_admin_id: string;
  viewed_at: string | null;
}

export interface MarkAsPaidData {
  paid_date: string;
  penalty_amount: number;
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  user_id?: string;
  competency?: string;
  due_date?: string;
  amount?: number;
  observations?: string;
  isComplete: boolean;
  isSent?: boolean;
  isProcessingOCR?: boolean;
  ocrExtracted?: {
    cpf?: string;
    competency?: string;
    due_date?: string;
    amount?: number;
    confidence: {
      cpf: number;
      competency: number;
      due_date: number;
      amount: number;
    };
  };
}

export interface User {
  id: string;
  full_name?: string;
  display_name?: string;
}