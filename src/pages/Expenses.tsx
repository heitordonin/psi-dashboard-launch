import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseWithCategory } from "@/types/expense";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const Expenses = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading, error } = useQuery({
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
    }
  });

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
      console.log('Excluindo despesa:', id);
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir despesa:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro na exclusão:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir despesa: " + error.message,
        variant: "destructive",
      });
    }
  });

  const handleEdit = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta despesa?")) {
      deleteExpenseMutation.mutate(id);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SignedIn>
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
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog}>
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
              {isLoading ? (
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
              ) : !expenses || expenses.length === 0 ? (
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
                      <TableHead>Código</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-mono text-sm">
                          {expense.expense_categories.code}
                        </TableCell>
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
                              onClick={() => openEditDialog(expense)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
      </SignedIn>
      <SignedOut>
        <RedirectToHome />
      </SignedOut>
    </div>
  );
};

const RedirectToHome = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return null;
};

export default Expenses;
