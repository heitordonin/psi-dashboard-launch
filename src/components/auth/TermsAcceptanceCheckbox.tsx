import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ExternalLink } from 'lucide-react';

interface TermsAcceptanceCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  termsUrl?: string;
}

export const TermsAcceptanceCheckbox: React.FC<TermsAcceptanceCheckboxProps> = ({
  checked,
  onChange,
  error,
  termsUrl = 'https://psiclo.com.br/termos-de-uso'
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="terms-acceptance"
          checked={checked}
          onCheckedChange={onChange}
          className="mt-1"
        />
        <Label
          htmlFor="terms-acceptance"
          className="text-sm font-normal cursor-pointer leading-5"
        >
          Li e concordo com os{' '}
          <a
            href={termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline font-medium inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            Termos de Uso
            <ExternalLink className="h-3 w-3" />
          </a>
        </Label>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1 ml-6">
          {error}
        </p>
      )}
    </div>
  );
};