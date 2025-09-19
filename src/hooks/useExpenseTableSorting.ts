import { useState, useMemo } from "react";
import type { ExpenseWithCategory } from "@/types/expense";

export type ExpenseSortField = 'category' | 'description' | 'amount' | 'payment_date' | 'competency';
export type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: ExpenseSortField | null;
  direction: SortDirection;
}

export function useExpenseTableSorting(expenses: ExpenseWithCategory[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  });

  const sortedExpenses = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return expenses;
    }

    return [...expenses].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'category':
          aValue = a.expense_categories.name || '';
          bValue = b.expense_categories.name || '';
          break;
        case 'description':
          aValue = a.description || '';
          bValue = b.description || '';
          break;
        case 'amount':
          aValue = Number(a.residential_adjusted_amount || a.amount);
          bValue = Number(b.residential_adjusted_amount || b.amount);
          break;
        case 'payment_date':
          aValue = new Date(a.payment_date);
          bValue = new Date(b.payment_date);
          break;
        case 'competency':
          aValue = a.competency || '';
          bValue = b.competency || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [expenses, sortConfig]);

  const handleSort = (field: ExpenseSortField) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        // Same field clicked - cycle through: asc -> desc -> null
        if (prevConfig.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prevConfig.direction === 'desc') {
          return { field: null, direction: null };
        } else {
          return { field, direction: 'asc' };
        }
      } else {
        // New field clicked - start with asc
        return { field, direction: 'asc' };
      }
    });
  };

  const getSortIcon = (field: ExpenseSortField) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction;
  };

  return {
    sortedExpenses,
    handleSort,
    getSortIcon,
    sortConfig
  };
}