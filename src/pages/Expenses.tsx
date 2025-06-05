import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    dateRange: { start: "", end: "" },
    amountRange: { min: "", max: "" }
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
        .select('*')
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

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.category === "" || expense.category === filters.category;
    
    const matchesDateRange = (() => {
      if (!filters.dateRange.start && !filters.dateRange.end) return true;
      const expenseDate = new Date(expense.payment_date);
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
      
      if (startDate && expenseDate < startDate) return false;
      if (endDate && expenseDate > endDate) return false;
      return true;
    })();

    const matchesAmountRange = (() => {
      if (!filters.amountRange.min && !filters.amountRange.max) return true;
      const amount = Number(expense.amount);
      const minAmount = filters.amountRange.min ? Number(filters.amountRange.min) : 0;
      const maxAmount = filters.amountRange.max ? Number(filters.amountRange.max) : Infinity;
      
      return amount >= minAmount && amount <= maxAmount;
    })();

    return matchesSearch && matchesCategory && matchesDateRange && matchesAmountRange;
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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
            <div className="bg-indigo-700 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white hover:bg-indigo-600" />
                  <div>
                    <h1 className="text-xl font-semibold text-white">Despesas</h1>
                    <p className="text-sm text-indigo-100">Gerencie suas despesas</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-white text-indigo-700 hover:bg-gray-100"
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
                        placeholder="Buscar por descrição ou categoria..."
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
                        filters={filters}
                        onFiltersChange={setFilters}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expenses List */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {expensesLoading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando despesas...</p>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {searchTerm || Object.values(filters).some(f => f) 
                        ? 'Nenhuma despesa encontrada com os filtros aplicados' 
                        : 'Nenhuma despesa cadastrada'
                      }
                    </p>
                    <Button onClick={() => setShowForm(true)} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar primeira despesa
                    </Button>
                  </div>
                ) : (
                  filteredExpenses.map((expense) => (
                    <Card key={expense.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{expense.description}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <p className="font-medium text-lg text-gray-900">
                            R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p>Categoria: {expense.category}</p>
                          <p>Data: {new Date(expense.payment_date).toLocaleDateString('pt-BR')}</p>
                          {expense.notes && <p>Observações: {expense.notes}</p>}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditExpense(expense)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeleteExpense(expense)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
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
                      onSave={handleFormClose}
                      onCancel={handleFormClose}
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
