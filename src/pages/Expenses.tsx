import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Receipt, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { ExpenseForm } from "@/components/ExpenseForm";
import { AdvancedExpenseFilter } from "@/components/AdvancedExpenseFilter";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "sonner";
import type { Expense } from "@/types/expense";

const Expenses = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deleteExpense, setDeleteExpense] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: "",
    startDate: "",
    endDate: "",
    isResidential: "",
    competency: "",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (
            name,
            code
          )
        `)
        .eq('owner_id', user.id)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Despesa excluída com sucesso!');
      setDeleteExpense(null);
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
      toast.error('Erro ao excluir despesa');
    }
  });

  // Helper function to get the effective amount (residential adjusted or regular)
  const getEffectiveAmount = (expense: any) => {
    if (expense.is_residential && expense.residential_adjusted_amount) {
      return expense.residential_adjusted_amount;
    }
    return expense.amount;
  };

  const filteredExpenses = expenses.filter(expense => {
    const categoryName = expense.expense_categories?.name || '';
    const matchesSearch = categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.categoryId === "" || expense.category_id === filters.categoryId;
    
    const matchesDateRange = (() => {
      if (!filters.startDate && !filters.endDate) return true;
      const expenseDate = new Date(expense.payment_date);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      if (startDate && expenseDate < startDate) return false;
      if (endDate && expenseDate > endDate) return false;
      return true;
    })();

    const matchesResidential = filters.isResidential === "" || 
      (filters.isResidential === "true" && expense.is_residential) ||
      (filters.isResidential === "false" && !expense.is_residential);

    const matchesCompetency = filters.competency === "" || 
      expense.competency?.toLowerCase().includes(filters.competency.toLowerCase());

    return matchesSearch && matchesCategory && matchesDateRange && matchesResidential && matchesCompetency;
  });

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setDeleteExpense(expense);
  };

  const confirmDelete = () => {
    if (deleteExpense) {
      deleteExpenseMutation.mutate(deleteExpense.id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-psiclo-primary"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-psiclo-primary px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white hover:bg-psiclo-secondary" />
                  <div>
                    <h1 className="text-xl font-semibold text-white">Despesas</h1>
                    <p className="text-sm text-psiclo-accent">Gerencie suas despesas</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-white text-psiclo-primary hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Despesa
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por categoria ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="sm:w-auto"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                    </Button>
                  </div>

                  {showFilters && (
                    <div className="mt-4 pt-4 border-t">
                      <AdvancedExpenseFilter
                        currentFilters={filters}
                        onFilterChange={setFilters}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expenses List */}
              <Card>
                <CardContent className="p-0">
                  {expensesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-psiclo-primary mx-auto"></div>
                      <p className="mt-4 text-gray-600">Carregando despesas...</p>
                    </div>
                  ) : filteredExpenses.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {searchTerm || Object.values(filters).some(f => f) 
                          ? 'Nenhuma despesa encontrada com os filtros aplicados' 
                          : 'Nenhuma despesa cadastrada'
                        }
                      </p>
                      <Button onClick={() => setShowForm(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Cadastrar primeira despesa
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y">
                      {filteredExpenses.map((expense) => {
                        const effectiveAmount = getEffectiveAmount(expense);
                        return (
                          <div key={expense.id} className="flex justify-between items-start p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {expense.expense_categories?.name || 'Categoria não encontrada'}
                              </p>
                              {expense.description && (
                                <p className="text-xs text-gray-600 truncate mt-1">{expense.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Data: {new Date(expense.payment_date).toLocaleDateString('pt-BR')}
                              </p>
                              {expense.is_residential && (
                                <div className="mt-1">
                                  <p className="text-xs text-green-600">Residencial (20% aplicado)</p>
                                  <p className="text-xs text-gray-500">
                                    Valor original: R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  R$ {Number(effectiveAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <ActionDropdown
                                onEdit={() => handleEditExpense(expense)}
                                onDelete={() => handleDeleteExpense(expense)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                    </h2>
                    <ExpenseForm
                      expense={editingExpense}
                      onClose={handleFormClose}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation */}
            <DeleteConfirmationDialog
              isOpen={!!deleteExpense}
              onClose={() => setDeleteExpense(null)}
              onConfirm={confirmDelete}
              title="Excluir Despesa"
              description={`Tem certeza de que deseja excluir esta despesa? Esta ação não pode ser desfeita.`}
              isLoading={deleteExpenseMutation.isPending}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Expenses;
