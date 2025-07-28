import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import type { InvoiceDescription } from "@/hooks/useInvoiceDescriptions";

interface DescriptionQuickFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingDescription: InvoiceDescription | null;
  onSubmit: (data: { subject?: string; text: string; id?: string }) => void;
  isLoading: boolean;
}

export const DescriptionQuickForm = ({
  isOpen,
  onClose,
  editingDescription,
  onSubmit,
  isLoading
}: DescriptionQuickFormProps) => {
  const [formData, setFormData] = useState({
    subject: '',
    text: ''
  });
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      toast.error('Texto é obrigatório');
      return;
    }

    const submitData = {
      subject: formData.subject.trim() || undefined,
      text: formData.text.trim(),
      ...(editingDescription && { id: editingDescription.id })
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({ subject: '', text: '' });
    onClose();
  };

  useEffect(() => {
    if (editingDescription) {
      setFormData({
        subject: editingDescription.subject || '',
        text: editingDescription.text
      });
    } else {
      setFormData({ subject: '', text: '' });
    }
  }, [editingDescription]);

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subject">Assunto (opcional)</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Ex: Consulta de acompanhamento"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="text">Texto da descrição *</Label>
        <Textarea
          id="text"
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          placeholder="Digite o texto que será usado como descrição padrão..."
          rows={4}
          required
          className="mt-1"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading
            ? (editingDescription ? "Atualizando..." : "Criando...")
            : (editingDescription ? "Atualizar" : "Criar")
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader className="text-left mb-6">
            <SheetTitle>
              {editingDescription ? 'Editar Descrição' : 'Nova Descrição'}
            </SheetTitle>
          </SheetHeader>
          <FormContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingDescription ? 'Editar Descrição' : 'Nova Descrição'}
          </DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
};