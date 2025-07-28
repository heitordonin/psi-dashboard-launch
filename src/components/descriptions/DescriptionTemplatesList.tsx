import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DescriptionTemplateItem } from './DescriptionTemplateItem';
import { DescriptionTemplateForm } from './DescriptionTemplateForm';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { useInvoiceDescriptions } from '@/hooks/useInvoiceDescriptions';
import { Search, Plus, FileText } from 'lucide-react';

interface DescriptionTemplatesListProps {
  onSelectDescription: (description: string) => void;
}

export function DescriptionTemplatesList({ onSelectDescription }: DescriptionTemplatesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState<any>(null);
  const [deletingDescription, setDeletingDescription] = useState<any>(null);

  const { descriptions, isLoading, createMutation, updateMutation, deleteMutation } = useInvoiceDescriptions(true);

  const filteredDescriptions = descriptions?.filter(desc => 
    desc.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    desc.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = (data: { subject?: string; text: string }) => {
    if (editingDescription) {
      updateMutation.mutate({
        id: editingDescription.id,
        ...data
      }, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingDescription(null);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        }
      });
    }
  };

  const handleEdit = (description: any) => {
    setEditingDescription(description);
    setIsFormOpen(true);
  };

  const handleDelete = (description: any) => {
    setDeletingDescription(description);
  };

  const confirmDelete = () => {
    if (deletingDescription) {
      deleteMutation.mutate(deletingDescription.id, {
        onSuccess: () => {
          setDeletingDescription(null);
        }
      });
    }
  };

  const openCreateForm = () => {
    setEditingDescription(null);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg border">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Descrições Padrão
          </h2>
        </div>

        {/* Action Button */}
        <div className="flex justify-start">
          <Button onClick={openCreateForm} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Descrição
          </Button>
        </div>

        {/* Search */}
        {descriptions && descriptions.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar descrições..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {descriptions && descriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma descrição cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira descrição padrão para agilizar o cadastro de cobranças
              </p>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Descrição
              </Button>
            </div>
          ) : filteredDescriptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma descrição encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDescriptions.map((description) => (
                <DescriptionTemplateItem
                  key={description.id}
                  id={description.id}
                  subject={description.subject}
                  text={description.text}
                  created_at={description.created_at}
                  onSelect={() => onSelectDescription(description.text)}
                  onEdit={() => handleEdit(description)}
                  onDelete={() => handleDelete(description)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <DescriptionTemplateForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDescription(null);
        }}
        editingDescription={editingDescription}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmationDialog
        isOpen={!!deletingDescription}
        onClose={() => setDeletingDescription(null)}
        onConfirm={confirmDelete}
        title="Excluir Descrição"
        description="Tem certeza que deseja excluir esta descrição? Esta ação não pode ser desfeita."
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}