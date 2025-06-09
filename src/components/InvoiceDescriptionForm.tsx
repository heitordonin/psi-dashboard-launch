
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { InvoiceDescription } from "@/hooks/useInvoiceDescriptions";

interface InvoiceDescriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingDescription: InvoiceDescription | null;
  onSubmit: (data: { subject?: string; text: string; id?: string }) => void;
  isLoading: boolean;
}

export const InvoiceDescriptionForm = ({
  isOpen,
  onClose,
  editingDescription,
  onSubmit,
  isLoading
}: InvoiceDescriptionFormProps) => {
  const [formData, setFormData] = useState({
    subject: editingDescription?.subject || '',
    text: editingDescription?.text || ''
  });

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

  // Update form data when editing description changes
  useState(() => {
    if (editingDescription) {
      setFormData({
        subject: editingDescription.subject || '',
        text: editingDescription.text
      });
    } else {
      setFormData({ subject: '', text: '' });
    }
  }, [editingDescription]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
