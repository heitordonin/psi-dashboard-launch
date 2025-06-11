
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStep1PaymentTypeProps {
  selectedType: 'single' | 'subscription';
  onSelect: (type: 'single' | 'subscription') => void;
  onNext: () => void;
}

export function WizardStep1PaymentType({ selectedType, onSelect, onNext }: WizardStep1PaymentTypeProps) {
  const handleSelect = (type: 'single' | 'subscription') => {
    onSelect(type);
    // Removido o auto-next que estava causando problemas
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          Escolha o tipo de cobrança
        </h2>
        <p className="text-gray-600">
          Selecione como você deseja cobrar o seu cliente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-lg",
            selectedType === 'single' ? "ring-2 ring-psiclo-primary bg-psiclo-primary/5" : "hover:bg-gray-50"
          )}
          onClick={() => handleSelect('single')}
        >
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-psiclo-primary/10 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-psiclo-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                À Vista ou Parcelado
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Cobre uma única vez ou parcele o valor para facilitar o pagamento
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-not-allowed opacity-50 transition-all duration-200"
          title="Em breve"
        >
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <RotateCcw className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-400">
                Recorrência
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                Configure cobranças recorrentes automáticas
              </p>
              <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                Em breve
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
