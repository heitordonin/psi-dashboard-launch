import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Settings, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { AdvancedExpenseFilter, ExpenseFilters } from "@/components/AdvancedExpenseFilter";
import { InvoiceDescriptionsManager } from "@/components/InvoiceDescriptionsManager";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useAuth } from "@/contexts/SupabaseAuthContext";

interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  is_residential: boolean;
  is_revenue: boolean;
  requires_competency: boolean;
}

interface ExpenseWithCategory {
  id: string;
  category_id: string;
  amount: number;
  payment_date: string;
  description?: string;
  competency?: string;
  is_residential: boolean;
  residential_adjusted_amount?: number;
  penalty_interest: number;
  created_at: string;
  expense_categories: ExpenseCategory;
}

type SortField = 'amount' | 'payment_date' | 'category_name';
type SortDirection = 'asc' | 'desc';

const Expenses = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDescriptionsOpen, setIsDescriptionsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | undefined>();
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithCategory | undefined>();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<ExpenseFilters>({
    categoryId: "",
    startDate: "",
    endDate: "",
    isResidential: "",
    competency: ""
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      console.log('Expenses - Buscando despesas para usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          category_id,
          amount,
          payment_date,
          description,
          competency,
          is_residential,
          residential_adjusted_amount,
          penalty_interest,
          created_at,
          expense_categories (
            id,
            name,
            code,
            is_residential,
            is_revenue,
            requires_competency
          )
        `)
        .order('payment_date', { ascending: false });
        
      if (error) {
        console.error('Expenses - Erro ao buscar despesas:', error);
        throw error;
      }
      
      console.log('Expenses - Despesas encontradas:', data);
      return data as ExpenseWithCategory[];
    },
    enabled: !!user,
    retry: 1
  });

  // Filter and sort expenses with proper null checks
  const filteredAndSortedExpenses = expenses?.filter(expense => {
    // Add null checks for expense and its properties
    if (!expense || !expense.expense_categories) {
      return false;
    }

    // Filter by category
    if (filters.categoryId && expense.expense_categories.id !== filters.categoryId) {
      return false;
    }
    
    // Filter by date range
    if (filters.startDate && expense.payment_date < filters.startDate) {
      return false;
    }
    
    if (filters.endDate && expense.payment_date > filters.endDate) {
      return false;
    }
    
    // Filter by residential
    if (filters.isResidential !== "" && expense.is_residential.toString() !== filters.isResidential) {
      return false;
    }
    
    // Filter by competency
    if (filters.competency && expense.competency !== filters.competency) {
      return false;
    }
    
    return true;
  })?.sort((a, b) => {
    if (!sortField || !a || !b) return 0;
    
    let aValue, bValue;
    
    if (sortField === 'amount') {
      aValue = a.amount;
      bValue = b.amount;
    } else if (sortField === 'payment_date') {
      aValue = new Date(a.payment_date).getTime();
      bValue = new Date(b.payment_date).getTime();
    } else if (sortField === 'category_name') {
      aValue = a.expense_categories?.name?.toLowerCase() || '';
      bValue = b.expense_categories?.name?.toLowerCase() || '';
    } else {
      return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) || [];

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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Expenses - Deletando despesa:', id);
      
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        console.error('Expenses - Erro ao deletar:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Despesa excluída com sucesso!');
      setDeletingExpense(undefined);
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir despesa: ' + error.message);
    }
  });

  const handleDelete = (expense: ExpenseWithCategory) => {
    setDeletingExpense(expense);
  };

  const confirmDelete = () => {
    if (deletingExpense) {
      deleteMutation.mutate(deletingExpense.id);
    }
  };

  const openEditDialog = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingExpense(undefined);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(undefined);
  };

  const handleFilterChange = (newFilters: ExpenseFilters) => {
    setFilters(newFilters);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 mb-6">
          <h1 className="text-3xl font-bold">Despesas</h1>
          
          {/* Mobile-first responsive button layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:flex-wrap sm:items-center">
            <div className="flex gap-2 order-1 sm:order-1">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none">
                Voltar
              </Button>
            </div>
            
            <div className="flex gap-2 order-3 sm:order-2 sm:ml-auto">
              <Button 
                variant="outline" 
                onClick={() => setIsDescriptionsOpen(true)}
                className="flex-1 sm:flex-none"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Descrições padrão</span>
                <span className="sm:hidden">Descrições</span>
              </Button>
              
              <AdvancedExpenseFilter 
                onFilterChange={handleFilterChange}
                currentFilters={filters}
              />
            </div>
            
            <div className="order-2 sm:order-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Despesa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                    </DialogTitle>
                  </DialogHeader>
                  <ExpenseForm expense={editingExpense} onClose={closeDialog} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Carregando...</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {filteredAndSortedExpenses?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma despesa encontrada
                  </div>
                ) : (
                  filteredAndSortedExpenses?.map((expense) => (
                    <Card key={expense.id}>
                      <CardContent className="text-sm p-4">
                        <p><strong>Categoria:</strong> {expense.expense_categories?.name || '-'}</p>
                        <p><strong>Valor:</strong> {formatCurrency(expense.amount)}</p>
                        {expense.is_residential && expense.residential_adjusted_amount && (
                          <p><strong>Valor Ajustado:</strong> {formatCurrency(expense.residential_adjusted_amount)}</p>
                        )}
                        <p><strong>Data:</strong> {formatDate(expense.payment_date)}</p>
                        <p><strong>Descrição:</strong> {expense.description || '-'}</p>
                        {expense.competency && (
                          <p><strong>Competência:</strong> {expense.competency}</p>
                        )}
                        {expense.is_residential && (
                          <p><strong>Residencial:</strong> Sim</p>
                        )}
                        <div className="flex justify-end gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(expense)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('category_name')}
                        >
                          Categoria {getSortIcon('category_name')}
                        </Button>
                      </TableHead>
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
                      <TableHead>Competência</TableHead>
                      <TableHead>Residencial</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedExpenses?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhuma despesa encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedExpenses?.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">
                            <span>{expense.expense_categories?.name || '-'}</span>
                            {expense.expense_categories?.is_revenue && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Receita
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{formatCurrency(expense.amount)}</span>
                              {expense.is_residential && expense.residential_adjusted_amount && (
                                <span className="text-xs text-gray-500">
                                  Ajustado: {formatCurrency(expense.residential_adjusted_amount)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(expense.payment_date)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {expense.description || '-'}
                          </TableCell>
                          <TableCell>{expense.competency || '-'}</TableCell>
                          <TableCell>
                            {expense.is_residential ? (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Sim
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                Não
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(expense)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(expense)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>

      <InvoiceDescriptionsManager 
        isOpen={isDescriptionsOpen}
        onClose={() => setIsDescriptionsOpen(false)}
      />

      <DeleteConfirmationDialog
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(undefined)}
        onConfirm={confirmDelete}
        title="Excluir Despesa"
        description={`Tem certeza que deseja excluir esta despesa da categoria ${deletingExpense?.expense_categories?.name || 'desconhecida'}?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Expenses;
