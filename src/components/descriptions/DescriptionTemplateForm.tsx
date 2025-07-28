import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface InvoiceDescription {
  id: string;
  subject?: string;
  text: string;
  created_at: string;
}

interface DescriptionTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingDescription?: InvoiceDescription;
  onSubmit: (data: { subject?: string; text: string }) => void;
  isLoading: boolean;
}

export function DescriptionTemplateForm({
  isOpen,
  onClose,
  editingDescription,
  onSubmit,
  isLoading
}: DescriptionTemplateFormProps) {
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (editingDescription) {
      setSubject(editingDescription.subject || '');
      setText(editingDescription.text);
    } else {
      setSubject('');
      setText('');
    }
  }, [editingDescription, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSubmit({
      subject: subject.trim() || undefined,
      text: text.trim()
    });
  };

  const handleClose = () => {
    setSubject('');
    setText('');
    onClose();
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Título (opcional)</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex: Consulta de Psicologia"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Descrição</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite a descrição da cobrança..."
          rows={4}
          className="w-full resize-none"
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!text.trim() || isLoading}>
          {isLoading ? 'Salvando...' : editingDescription ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[50vh] m-4 rounded-t-xl">
          <SheetHeader className="pb-4">
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
      <DialogContent className="max-w-lg mx-4 p-6">
        <DialogHeader className="pb-4">
          <DialogTitle>
            {editingDescription ? 'Editar Descrição' : 'Nova Descrição'}
          </DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
}