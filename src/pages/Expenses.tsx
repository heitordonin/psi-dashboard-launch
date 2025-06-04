import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseWithCategory } from "@/types/expense";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AdvancedExpenseFilter } from "@/components/AdvancedExpenseFilter";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

type SortField = 'amount' | 'payment_date';
type SortDirection = 'asc' | 'desc';

const Expenses = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState({
    categories: [] as string[],
    startDate: "",
    endDate: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const { data: expenses, isLoading: expensesLoading, error } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      console.log('Carregando despesas...');
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select(`
            *,
            expense_categories (*)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao carregar despesas:', error);
          throw error;
        }
        
        console.log('Despesas carregadas:', data);
        return data as ExpenseWithCategory[];
      } catch (err) {
        console.error('Erro na query de despesas:', err);
        throw err;
      }
    },
    enabled: !!user
  });

  // Filter and sort expenses
  const filteredAndSortedExpenses = expenses?.filter(expense => {
    // Filter by categories
    if (filters.categories.length > 0 && !filters.categories.includes(expense.category_id)) {
      return false;
    }
    
    // Filter by date range
    if (filters.startDate && expense.payment_date < filters.startDate) {
      return false;
    }
    
    if (filters.endDate && expense.payment_date > filters.endDate) {
      return false;
    }
    
    return true;
  })?.sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue, bValue;
    
    if (sortField === 'amount') {
      aValue = a.amount;
      bValue = b.amount;
    } else if (sortField === 'payment_date') {
      aValue = new Date(a.payment_date).getTime();
      bValue = new Date(b.payment_date).getTime();
    } else {
      return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Log de erros para debug
  useEffect(() => {
    if (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro de conectividade",
        description: "Erro ao conectar com o banco de dados: " + error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('=== INICIANDO EXCLUSÃO ===');
      console.log('ID da despesa:', id);
      console.log('Usuário autenticado:', user?.id);
      
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Erro ao excluir despesa:', deleteError);
        throw new Error(`Erro ao excluir despesa: ${deleteError.message}`);
      }

      console.log('=== EXCLUSÃO CONCLUÍDA ===');
      return id;
    },
    onSuccess: (deletedId) => {
      console.log('=== SUCESSO NA EXCLUSÃO ===');
      console.log('ID excluído:', deletedId);
      
      // Invalidar a query para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
      });
      
      console.log('=== PROCESSO DE EXCLUSÃO CONCLUÍDO ===');
    },
    onError: (error: any) => {
      console.error('=== ERRO NA EXCLUSÃO ===');
      console.error('Detalhes do erro:', error);
      
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a despesa.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async (expense: ExpenseWithCategory) => {
    console.log('=== INICIANDO PROCESSO DE EXCLUSÃO ===');
    console.log('Despesa selecionada:', {
      id: expense.id,
      categoria: expense.expense_categories?.name,
      valor: expense.amount,
      owner_id: expense.owner_id
    });
    
    deleteExpenseMutation.mutate(expense.id);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  const openEditDialog = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const openCreateDialog = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Adicionar logs de debug para conectividade
  useEffect(() => {
    console.log('Estado da página Expenses:');
    console.log('- Loading:', isLoading);
    console.log('- Error:', error);
    console.log('- Expenses data:', expenses);
  }, [isLoading, error, expenses]);

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
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Despesas</h1>
              <p className="text-gray-600">Gerencie as despesas do consultório</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Voltar ao Dashboard
              </Button>
              <AdvancedExpenseFilter 
                onFilterChange={handleFilterChange}
                currentFilters={filters}
              />
              {/* Desktop New Expense Button */}
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog} className="hidden md:flex">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Despesa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpense ? "Editar Despesa" : "Nova Despesa"}
                    </DialogTitle>
                  </DialogHeader>
                  <ExpenseForm 
                    expense={editingExpense} 
                    onClose={handleFormClose}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-medium">Erro de conectividade</h3>
              <p className="text-red-600 text-sm mt-1">
                Não foi possível conectar ao banco de dados. Verifique sua conexão.
              </p>
              <p className="text-red-500 text-xs mt-2 font-mono">
                Detalhes: {error.message}
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {expensesLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Carregando despesas...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-500 mb-4">Erro ao carregar dados</p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['expenses'] })}
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : !filteredAndSortedExpenses || filteredAndSortedExpenses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Nenhuma despesa encontrada</p>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar primeira despesa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingExpense ? "Editar Despesa" : "Nova Despesa"}
                      </DialogTitle>
                    </DialogHeader>
                    <ExpenseForm 
                      expense={editingExpense} 
                      onClose={handleFormClose}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort('amount')}
                      >
                        Valor {getSortIcon('amount')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort('payment_date')}
                      >
                        Data {getSortIcon('payment_date')}
                      </Button>
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {expense.expense_categories.name}
                        {expense.is_residential && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Residencial
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{formatDate(expense.payment_date)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {expense.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DeleteConfirmationDialog
                            title="Confirmar exclusão"
                            description={`Tem certeza que deseja excluir a despesa "${expense.expense_categories?.name}" no valor de ${formatCurrency(expense.amount)}? Esta ação não pode ser desfeita.`}
                            onConfirm={() => handleDelete(expense)}
                            isLoading={deleteExpenseMutation.isPending}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogTrigger asChild>
          <Button 
            onClick={openCreateDialog}
            className="fixed bottom-6 right-4 z-50 md:hidden h-14 w-14 rounded-full shadow-lg"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Editar Despesa" : "Nova Despesa"}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm 
            expense={editingExpense} 
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
