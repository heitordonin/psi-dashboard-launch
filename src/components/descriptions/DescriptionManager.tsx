import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoiceDescriptions, type InvoiceDescription } from "@/hooks/useInvoiceDescriptions";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DescriptionQuickForm } from "./DescriptionQuickForm";
import { Plus, Edit, Trash2, FileText, Calendar } from "lucide-react";

interface DescriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DescriptionManager = ({ isOpen, onClose }: DescriptionManagerProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState<InvoiceDescription | null>(null);
  const [deletingDescription, setDeletingDescription] = useState<InvoiceDescription | null>(null);
  const isMobile = useIsMobile();

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

  const DescriptionList = () => (
    <>
      {isLoading ? (
        <div className={`space-y-3 ${isMobile ? 'p-4' : ''}`}>
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : descriptions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">Nenhuma descrição cadastrada</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Crie descrições padrão para agilizar o preenchimento de cobranças
            </p>
            <Button onClick={openCreateForm}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Descrição
            </Button>
          </div>
        </div>
      ) : (
        <div className={`space-y-3 ${isMobile ? 'p-4' : ''}`}>
          {descriptions.map((description) => (
            <Card key={description.id} className="group hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground mb-1">
                      {description.subject || "Sem assunto"}
                    </h4>
                    <div className="flex items-center text-xs text-muted-foreground mb-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(description.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(description)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(description)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent side="bottom" className="h-[85vh] flex flex-col">
            <SheetHeader className="flex-shrink-0 border-b pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Gerenciar Descrições
                </SheetTitle>
                <Button onClick={openCreateForm} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova
                </Button>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <DescriptionList />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <DescriptionQuickForm
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
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Gerenciar Descrições Padrão
              </DialogTitle>
              <Button onClick={openCreateForm} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Descrição
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2">
            <DescriptionList />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <DescriptionQuickForm
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