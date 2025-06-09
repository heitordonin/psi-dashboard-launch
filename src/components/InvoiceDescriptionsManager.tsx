
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface InvoiceDescription {
  id: string;
  subject?: string;
  text: string;
  created_at: string;
}

interface InvoiceDescriptionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceDescriptionsManager = ({ isOpen, onClose }: InvoiceDescriptionsManagerProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState<InvoiceDescription | null>(null);
  const [deletingDescription, setDeletingDescription] = useState<InvoiceDescription | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    text: ''
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: descriptions = [], isLoading } = useQuery({
    queryKey: ['invoice-descriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('invoice_descriptions')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InvoiceDescription[];
    },
    enabled: isOpen && !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data: { subject?: string; text: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('invoice_descriptions')
        .insert({
          ...data,
          owner_id: user.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-descriptions', user?.id] });
      toast.success('Descrição criada com sucesso!');
      setIsFormOpen(false);
      setFormData({ subject: '', text: '' });
    },
    onError: (error: any) => {
      toast.error('Erro ao criar descrição: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; subject?: string; text: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('invoice_descriptions')
        .update(updateData)
        .eq('id', id)
        .eq('owner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-descriptions', user?.id] });
      toast.success('Descrição atualizada com sucesso!');
      setIsFormOpen(false);
      setEditingDescription(null);
      setFormData({ subject: '', text: '' });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar descrição: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('invoice_descriptions')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-descriptions', user?.id] });
      toast.success('Descrição excluída com sucesso!');
      setDeletingDescription(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir descrição: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      toast.error('Texto é obrigatório');
      return;
    }

    if (editingDescription) {
      updateMutation.mutate({
        id: editingDescription.id,
        subject: formData.subject.trim() || undefined,
        text: formData.text.trim()
      });
    } else {
      createMutation.mutate({
        subject: formData.subject.trim() || undefined,
        text: formData.text.trim()
      });
    }
  };

  const handleEdit = (description: InvoiceDescription) => {
    setEditingDescription(description);
    setFormData({
      subject: description.subject || '',
      text: description.text
    });
    setIsFormOpen(true);
  };

  const handleDelete = (description: InvoiceDescription) => {
    setDeletingDescription(description);
  };

  const confirmDelete = () => {
    if (deletingDescription) {
      deleteMutation.mutate(deletingDescription.id);
    }
  };

  const openCreateForm = () => {
    setEditingDescription(null);
    setFormData({ subject: '', text: '' });
    setIsFormOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Descrições Padrão</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button onClick={openCreateForm} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Nova Descrição
            </Button>

            {isLoading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : (
              <div className="space-y-3">
                {descriptions.map((description) => (
                  <Card key={description.id}>
                    <CardContent className="p-4">
                      {description.subject && (
                        <h4 className="font-medium text-sm mb-2">{description.subject}</h4>
                      )}
                      <p className="text-sm text-gray-600 mb-3">{description.text}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(description)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(description)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {descriptions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma descrição cadastrada
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDescription ? 'Editar Descrição' : 'Nova Descrição'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Assunto (opcional)</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ex: Consulta de acompanhamento"
              />
            </div>

            <div>
              <Label htmlFor="text">Texto *</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Digite o texto da descrição"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {(createMutation.isPending || updateMutation.isPending)
                  ? (editingDescription ? "Atualizando..." : "Criando...")
                  : (editingDescription ? "Atualizar" : "Criar")
                }
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={!!deletingDescription}
        onClose={() => setDeletingDescription(null)}
        onConfirm={confirmDelete}
        title="Excluir Descrição"
        description={`Tem certeza que deseja excluir a descrição "${deletingDescription?.subject || 'sem assunto'}"?`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
