
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, FileText, Lock } from 'lucide-react';
import { useSecureAuth } from '@/hooks/useSecureAuth';

interface WizardStep0Props {
  selectedType?: 'link' | 'manual';
  onSelect: (type: 'link' | 'manual') => void;
}

export function WizardStep0ChargeType({ selectedType, onSelect }: WizardStep0Props) {
  const { canPerformAdminAction } = useSecureAuth();
  const isAdmin = canPerformAdminAction();

  const handleLinkOptionClick = () => {
    if (isAdmin) {
      onSelect('link');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Tipo de Cobrança</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Escolha como deseja criar sua cobrança
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className={`transition-all hover:shadow-md relative ${
              !isAdmin 
                ? 'opacity-50 cursor-not-allowed' 
                : `cursor-pointer ${selectedType === 'link' ? 'ring-2 ring-primary' : ''}`
            }`}
            onClick={handleLinkOptionClick}
          >
            {!isAdmin && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-gray-600 text-white p-1 rounded">
                  <Lock className="h-4 w-4" />
                </div>
              </div>
            )}
            <CardHeader className="text-center">
              <div className={`mx-auto mb-4 p-3 rounded-full w-fit ${
                isAdmin ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <CreditCard className={`h-6 w-6 ${
                  isAdmin ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <CardTitle className={`text-lg ${!isAdmin ? 'text-gray-400' : ''}`}>
                Enviar link de pagamento
              </CardTitle>
              <CardDescription className={!isAdmin ? 'text-gray-400' : ''}>
                Cria uma cobrança com link para o cliente pagar online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className={`text-sm space-y-1 ${
                isAdmin ? 'text-muted-foreground' : 'text-gray-400'
              }`}>
                <li>• Gera link de pagamento automático</li>
                <li>• Permite pagamento por cartão ou boleto</li>
                <li>• Envio de lembretes</li>
                <li>• Confirmação de pagamento em tempo real</li>
              </ul>
              {!isAdmin && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  <Lock className="h-3 w-3 inline mr-1" />
                  Funcionalidade disponível apenas para administradores
                </div>
              )}
              <Button 
                variant={selectedType === 'link' ? 'default' : 'outline'} 
                className="w-full mt-4"
                disabled={!isAdmin}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAdmin) {
                    onSelect('link');
                  }
                }}
              >
                {!isAdmin ? 'Não Disponível' : (selectedType === 'link' ? 'Selecionado' : 'Selecionar')}
              </Button>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === 'manual' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelect('manual')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-green-100 w-fit">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Registrar cobrança manual</CardTitle>
              <CardDescription>
                Registra uma cobrança para controle interno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ideal quando cobrar via PIX fixo</li>
                <li>• Não gera link de pagamento</li>
                <li>• Ideal para pagamentos já recebidos</li>
                <li>• Baixa manual de recebimento</li>
              </ul>
              <Button 
                variant={selectedType === 'manual' ? 'default' : 'outline'} 
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect('manual');
                }}
              >
                {selectedType === 'manual' ? 'Selecionado' : 'Selecionar'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
