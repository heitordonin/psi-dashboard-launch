
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseWithCategory } from "@/types/expense";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const Expenses = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExpenseWithCategory[];
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
      });
    },
    onError: (error) => {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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
                <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <SheetTrigger asChild>
                    <Button onClick={() => setEditingExpense(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Despesa
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-lg">
                    <ExpenseForm 
                      expense={editingExpense} 
                      onClose={handleFormClose}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </header>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Carregando despesas...</p>
                </div>
              ) : !expenses || expenses.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">Nenhuma despesa encontrada</p>
                  <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <SheetTrigger asChild>
                      <Button onClick={() => setEditingExpense(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar primeira despesa
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-lg">
                      <ExpenseForm 
                        expense={editingExpense} 
                        onClose={handleFormClose}
                      />
                    </SheetContent>
                  </Sheet>
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
                              onClick={() => handleEdit(expense)}
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
