
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Info, Settings } from "lucide-react";
import PaymentFormWrapper from "@/components/payments/PaymentFormWrapper";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { PaymentWithPatient } from "@/types/payment";
import { InvoiceDescriptionsManager } from "@/components/InvoiceDescriptionsManager";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/contexts/SupabaseAuthContext";

const Payments = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDescriptionsOpen, setIsDescriptionsOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentWithPatient | undefined>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      console.log('Payments - Buscando pagamentos para usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          patients!inner(full_name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Payments - Erro ao buscar pagamentos:', error);
        throw error;
      }
      
      console.log('Payments - Pagamentos encontrados:', data);
      return data as PaymentWithPatient[];
    },
    enabled: !!user,
    retry: 1
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Payments - Deletando pagamento:', id);
      
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) {
        console.error('Payments - Erro ao deletar:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir cobrança: ' + error.message);
    }
  });

  const handleDelete = (payment: PaymentWithPatient) => {
    if (window.confirm(`Tem certeza que deseja excluir a cobrança de ${payment.patients.full_name}?`)) {
      deleteMutation.mutate(payment.id);
    }
  };

  const openEditDialog = (payment: PaymentWithPatient) => {
    setEditingPayment(payment);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPayment(undefined);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPayment(undefined);
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

  const canEdit = (status: string) => status === 'draft' || status === 'pending';
  const canDelete = (status: string) => status === 'draft';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Cobranças</h1>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Voltar
            </Button>
            <LogoutButton />
            <Button 
              variant="outline" 
              onClick={() => setIsDescriptionsOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Descrições padrão
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Cobrança
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPayment ? 'Editar Cobrança' : 'Nova Cobrança'}
                  </DialogTitle>
                </DialogHeader>
                <PaymentFormWrapper payment={editingPayment} onClose={closeDialog} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Data Recebimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhuma cobrança cadastrada
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patients.full_name}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{formatDate(payment.due_date)}</TableCell>
                      <TableCell>
                        {payment.paid_date ? formatDate(payment.paid_date) : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{payment.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PaymentStatusBadge status={payment.status} />
                          {payment.status === 'draft' && (
                            <div className="group relative">
                              <Info className="w-4 h-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                Cobrança salva. Envio ao paciente será habilitado em breve.
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(payment)}
                            disabled={!canEdit(payment.status)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(payment)}
                            disabled={!canDelete(payment.status) || deleteMutation.isPending}
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
          )}
        </div>
      </div>

      <InvoiceDescriptionsManager 
        isOpen={isDescriptionsOpen}
        onClose={() => setIsDescriptionsOpen(false)}
      />
    </div>
  );
};

export default Payments;
