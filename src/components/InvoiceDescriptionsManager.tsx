
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";

interface InvoiceDescription {
  id: string;
  subject: string;
  text: string;
  owner_id: string;
  created_at: string;
}

interface InvoiceDescriptionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceDescriptionsManager = ({ isOpen, onClose }: InvoiceDescriptionsManagerProps) => {
  const [editingDescription, setEditingDescription] = useState<InvoiceDescription | null>(null);
  const [formData, setFormData] = useState({ subject: '', text: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: descriptions = [], isLoading } = useQuery({
    queryKey: ['invoice-descriptions'],
    queryFn: async () => {
      console.log('Carregando descrições...');
      const { data, error } = await supabase
        .from('invoice_descriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao carregar descrições:', error);
        throw error;
      }
      console.log('Descrições carregadas:', data);
      return data as InvoiceDescription[];
    },
    enabled: isOpen
  });

  const createMutation = useMutation({
    mutationFn: async (data: { subject: string; text: string }) => {
      console.log('Criando descrição:', data);
      const { error } = await supabase
        .from('invoice_descriptions')
        .insert([{ subject: data.subject, text: data.text }]);
      if (error) {
        console.error('Erro ao criar descrição:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-descriptions'] });
      toast.success('Descrição criada com sucesso!');
      setFormData({ subject: '', text: '' });
      setEditingDescription(null);
    },
    onError: (error: any) => {
      console.error('Erro na criação:', error);
      toast.error('Erro ao criar descrição: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; subject: string; text: string }) => {
      console.log('Atualizando descrição:', data);
      const { error } = await supabase
        .from('invoice_descriptions')
        .update({ subject: data.subject, text: data.text })
        .eq('id', data.id);
      if (error) {
        console.error('Erro ao atualizar descrição:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-descriptions'] });
      toast.success('Descrição atualizada com sucesso!');
      setFormData({ subject: '', text: '' });
      setEditingDescription(null);
    },
    onError: (error: any) => {
      console.error('Erro na atualização:', error);
      toast.error('Erro ao atualizar descrição: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Excluindo descrição:', id);
      const { error } = await supabase
        .from('invoice_descriptions')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Erro ao excluir descrição:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-descriptions'] });
      toast.success('Descrição excluída com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na exclusão:', error);
      toast.error('Erro ao excluir descrição: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Assunto é obrigatório';
    }
    
    if (!formData.text.trim()) {
      newErrors.text = 'Descrição é obrigatória';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      if (editingDescription) {
        updateMutation.mutate({ 
          id: editingDescription.id, 
          subject: formData.subject.trim(), 
          text: formData.text.trim() 
        });
      } else {
        createMutation.mutate({ 
          subject: formData.subject.trim(), 
          text: formData.text.trim() 
        });
      }
    }
  };

  const handleEdit = (description: InvoiceDescription) => {
    setEditingDescription(description);
    setFormData({ subject: description.subject, text: description.text });
  };

  const handleDelete = (description: InvoiceDescription) => {
    if (window.confirm(`Tem certeza que deseja excluir a descrição "${description.subject}"?`)) {
      deleteMutation.mutate(description.id);
    }
  };

  const handleCancel = () => {
    setEditingDescription(null);
    setFormData({ subject: '', text: '' });
    setErrors({});
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Descrições Padrão</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div>
              <Label htmlFor="subject">
                {editingDescription ? 'Editar Assunto' : 'Novo Assunto'} *
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Digite o assunto da descrição"
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
            </div>

            <div>
              <Label htmlFor="text">
                {editingDescription ? 'Editar Descrição' : 'Nova Descrição'} *
              </Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Digite a descrição completa"
                className={errors.text ? 'border-red-500' : ''}
                rows={4}
              />
              {errors.text && <p className="text-red-500 text-sm mt-1">{errors.text}</p>}
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingDescription ? 'Atualizar' : 'Criar'} Descrição
              </Button>
              {editingDescription && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>

          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {descriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Nenhuma descrição cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    descriptions.map((description) => (
                      <TableRow key={description.id}>
                        <TableCell className="font-medium">{description.subject}</TableCell>
                        <TableCell className="max-w-xs">
                          {truncateText(description.text, 60)}
                        </TableCell>
                        <TableCell>
                          {new Date(description.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
