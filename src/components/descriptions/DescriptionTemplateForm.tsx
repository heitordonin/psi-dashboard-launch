import { useState, useEffect, useCallback, memo, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface InvoiceDescription {
  id: string;
  subject?: string;
  text: string;
  created_at: string;
}

interface FormContentProps {
  subject: string;
  text: string;
  onSubjectChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isLoading: boolean;
  editingDescription?: InvoiceDescription;
  formId: string;
}

const FormContent = memo(({ 
  subject, 
  text, 
  onSubjectChange, 
  onTextChange, 
  onSubmit, 
  onClose, 
  isLoading, 
  editingDescription,
  formId 
}: FormContentProps) => {
  console.log('FormContent render');
  
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${formId}-subject`}>Título (opcional)</Label>
        <Input
          id={`${formId}-subject`}
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Ex: Consulta de Psicologia"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-text`}>Descrição</Label>
        <Textarea
          id={`${formId}-text`}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Digite a descrição da cobrança..."
          rows={4}
          className="w-full resize-none"
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!text.trim() || isLoading}>
          {isLoading ? 'Salvando...' : editingDescription ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
});

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
  const formId = useId();
  const isMobile = useIsMobile();

  console.log('DescriptionTemplateForm render', { subject, text });

  useEffect(() => {
    if (editingDescription) {
      setSubject(editingDescription.subject || '');
      setText(editingDescription.text);
    } else {
      setSubject('');
      setText('');
    }
  }, [editingDescription]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSubmit({
      subject: subject.trim() || undefined,
      text: text.trim()
    });
  }, [text, subject, onSubmit]);

  const handleClose = useCallback(() => {
    setSubject('');
    setText('');
    onClose();
  }, [onClose]);

  const handleSubjectChange = useCallback((value: string) => {
    console.log('handleSubjectChange', value);
    setSubject(value);
  }, []);

  const handleTextChange = useCallback((value: string) => {
    console.log('handleTextChange', value);
    setText(value);
  }, []);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[50vh] m-4 rounded-t-xl">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingDescription ? 'Editar Descrição' : 'Nova Descrição'}
            </SheetTitle>
          </SheetHeader>
          <FormContent
            subject={subject}
            text={text}
            onSubjectChange={handleSubjectChange}
            onTextChange={handleTextChange}
            onSubmit={handleSubmit}
            onClose={handleClose}
            isLoading={isLoading}
            editingDescription={editingDescription}
            formId={formId}
          />
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
          <DialogDescription>
            {editingDescription ? 'Edite sua descrição existente' : 'Crie uma nova descrição para suas cobranças'}
          </DialogDescription>
        </DialogHeader>
        <FormContent
          subject={subject}
          text={text}
          onSubjectChange={handleSubjectChange}
          onTextChange={handleTextChange}
          onSubmit={handleSubmit}
          onClose={handleClose}
          isLoading={isLoading}
          editingDescription={editingDescription}
          formId={formId}
        />
      </DialogContent>
    </Dialog>
  );
}