import { useMemo, useState } from "react";
import { createSafeDateFromString } from "@/utils/dateUtils";
import type { ExpenseWithCategory } from "@/types/expense";

export interface ExpenseFilters {
  categoryId: string;
  startDate: string;
  endDate: string;
  isResidential: string;
  competency: string;
  minAmount: string;
  maxAmount: string;
}

export const useExpenseFilters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ExpenseFilters>({
    categoryId: "",
    startDate: "",
    endDate: "",
    isResidential: "",
    competency: "",
    minAmount: "",
    maxAmount: ""
  });

  const getFilteredExpenses = (expenses: ExpenseWithCategory[]) => {
    return useMemo(() => {
      return expenses.filter(expense => {
        const categoryName = expense.expense_categories.name || '';
        const paymentDateFormatted = createSafeDateFromString(expense.payment_date).toLocaleDateString('pt-BR');
        const amountFormatted = (expense.residential_adjusted_amount || expense.amount).toString();
        const competencyValue = expense.competency || '';
        
        const matchesSearch = categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             paymentDateFormatted.includes(searchTerm) ||
                             amountFormatted.includes(searchTerm) ||
                             competencyValue.includes(searchTerm);
        
        const matchesCategoryId = !filters.categoryId || expense.category_id === filters.categoryId;
        
        const matchesResidential = (() => {
          if (!filters.isResidential) return true;
          if (filters.isResidential === "true") return expense.is_residential;
          if (filters.isResidential === "false") return !expense.is_residential;
          return true;
        })();
        
        const matchesCompetency = !filters.competency || 
          (expense.competency && expense.competency.includes(filters.competency));
        
        const matchesDateRange = (() => {
          if (!filters.startDate && !filters.endDate) return true;
          const expenseDate = createSafeDateFromString(expense.payment_date);
          const startDate = filters.startDate ? createSafeDateFromString(filters.startDate) : null;
          const endDate = filters.endDate ? createSafeDateFromString(filters.endDate) : null;
          
          if (startDate && expenseDate < startDate) return false;
          if (endDate && expenseDate > endDate) return false;
          return true;
        })();

        const matchesAmountRange = (() => {
          if (!filters.minAmount && !filters.maxAmount) return true;
          const amount = Number(expense.residential_adjusted_amount || expense.amount);
          const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
          const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : null;

          if (minAmount && amount < minAmount) return false;
          if (maxAmount && amount > maxAmount) return false;
          return true;
        })();

        return matchesSearch && matchesCategoryId && matchesResidential && 
               matchesCompetency && matchesDateRange && matchesAmountRange;
      });
    }, [expenses, searchTerm, filters]);
  };

  const hasFilters = Boolean(
    searchTerm || 
    filters.categoryId || 
    filters.startDate || 
    filters.endDate ||
    filters.isResidential ||
    filters.competency ||
    filters.minAmount ||
    filters.maxAmount
  );

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    getFilteredExpenses,
    hasFilters
  };
};