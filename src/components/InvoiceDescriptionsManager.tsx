
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { InvoiceDescriptionsList } from "@/components/InvoiceDescriptionsList";
import { InvoiceDescriptionForm } from "@/components/InvoiceDescriptionForm";
import { useInvoiceDescriptions, type InvoiceDescription } from "@/hooks/useInvoiceDescriptions";

interface InvoiceDescriptionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceDescriptionsManager = ({ isOpen, onClose }: InvoiceDescriptionsManagerProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState<InvoiceDescription | null>(null);
  const [deletingDescription, setDeletingDescription] = useState<InvoiceDescription | null>(null);

  const {
    descriptions,
    isLoading,
    createMutation,
    updateMutation,
    deleteMutation
  } = useInvoiceDescriptions(isOpen);

  const handleSubmit = (data: { subject?: string; text: string; id?: string }) => {
    if (data.id) {
      updateMutation.mutate(
        { id: data.id, subject: data.subject, text: data.text },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingDescription(null);
          }
        }
      );
    } else {
      createMutation.mutate(
        { subject: data.subject, text: data.text },
        {
          onSuccess: () => {
            setIsFormOpen(false);
          }
        }
      );
    }
  };

  const handleEdit = (description: InvoiceDescription) => {
    setEditingDescription(description);
    setIsFormOpen(true);
  };

  const handleDelete = (description: InvoiceDescription) => {
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Descrições Padrão</DialogTitle>
          </DialogHeader>

          <InvoiceDescriptionsList
            descriptions={descriptions}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateNew={openCreateForm}
          />
        </DialogContent>
      </Dialog>

      <InvoiceDescriptionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingDescription={editingDescription}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

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
