
export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  is_residential: boolean;
  is_revenue: boolean;
  requires_competency: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id: string;
  amount: number;
  payment_date: string;
  penalty_interest: number;
  description?: string;
  is_residential: boolean;
  residential_adjusted_amount?: number;
  competency?: string;
  owner_id?: string;
  created_at: string;
}

export interface ExpenseWithCategory extends Expense {
  expense_categories: ExpenseCategory;
}
