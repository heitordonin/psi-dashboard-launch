import { useState } from 'react';
import { ExpensesHeader } from './ExpensesHeader';
import { ExpensesSearchFilter } from './ExpensesSearchFilter';
import { ExpensesList } from './ExpensesList';
import { ExpenseForm } from '../ExpenseForm';
import { useExpenseFilters } from '@/hooks/useExpenseFilters';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import type { ExpenseWithCategory } from '@/types/expense';

interface ExpensesContentProps {
  userId: string;
}

export const ExpensesContent = ({ userId }: ExpensesContentProps) => {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithCategory | null>(null);
  const queryClient = useQueryClient();

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (*)
        `)
        .eq('owner_id', userId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as ExpenseWithCategory[];
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Delete mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      toast.success('Despesa excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
      toast.error('Erro ao excluir despesa');
    }
  });

  const { searchTerm, setSearchTerm, filters, setFilters, getFilteredExpenses, hasFilters } = useExpenseFilters();

  const filteredExpenses = getFilteredExpenses(expenses);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleCloseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      setDeletingExpense(expense);
    }
  };

  const confirmDeleteExpense = () => {
    if (deletingExpense) {
      deleteExpenseMutation.mutate(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 touch-pan-y">
      <ExpensesHeader 
        onAddExpense={handleAddExpense}
        totalExpenses={expenses.length}
      />
      
      <div className="p-4 md:p-6 space-y-6 pb-safe">
        <ExpensesSearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFilterChange={setFilters}
          categories={categories}
        />

        <ExpensesList
          expenses={filteredExpenses}
          isLoading={expensesLoading}
          onDeleteExpense={handleDeleteExpense}
          onEditExpense={handleEditExpense}
          onAddExpense={handleAddExpense}
          onRefresh={handleRefresh}
          hasFilters={hasFilters}
          isFormOpen={showExpenseForm}
        />
      </div>

      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <ExpenseForm
            expense={editingExpense}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={confirmDeleteExpense}
        title="Excluir Despesa"
        description={`Tem certeza que deseja excluir a despesa "${deletingExpense?.expense_categories?.name || ''}"? Esta ação não pode ser desfeita.`}
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
};