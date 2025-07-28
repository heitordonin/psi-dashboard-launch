import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DescriptionTemplatesList } from './DescriptionTemplatesList';
import { useIsMobile } from '@/hooks/use-mobile';

interface DescriptionTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDescription: (description: string) => void;
}

export function DescriptionTemplateSelector({
  isOpen,
  onClose,
  onSelectDescription
}: DescriptionTemplateSelectorProps) {
  const isMobile = useIsMobile();

  const handleSelectDescription = (description: string) => {
    onSelectDescription(description);
    onClose();
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[70vh] m-4 rounded-t-xl p-6">
          <DescriptionTemplatesList onSelectDescription={handleSelectDescription} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-6">
        <DescriptionTemplatesList onSelectDescription={handleSelectDescription} />
      </DialogContent>
    </Dialog>
  );
}