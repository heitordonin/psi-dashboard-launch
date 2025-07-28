
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DescriptionTemplateSelector } from '@/components/descriptions/DescriptionTemplateSelector';
import { FileText } from 'lucide-react';

interface PaymentDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function PaymentDescriptionField({ value, onChange }: PaymentDescriptionFieldProps) {
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  const handleSelectDescription = (description: string) => {
    onChange(description);
    setShowDescriptionModal(false);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Descrição</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDescriptionModal(true)}
            className="text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Usar Template
          </Button>
        </div>
        <Textarea
          id="description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Descrição da cobrança..."
          className="w-full"
        />
      </div>

      <DescriptionTemplateSelector
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        onSelectDescription={handleSelectDescription}
      />
    </>
  );
}
