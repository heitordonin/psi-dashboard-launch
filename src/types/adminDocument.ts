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
}

export interface MarkAsPaidData {
  paid_date: string;
  penalty_amount: number;
}