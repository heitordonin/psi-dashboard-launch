
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Tipo de Cobrança</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Escolha como deseja criar sua cobrança
        </p>
        
        <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'md:grid-cols-2' : ''}`}>
          {isAdmin && (
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType === 'link' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelect('link')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100 w-fit">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">
                  Enviar link de pagamento
                </CardTitle>
                <CardDescription>
                  Cria uma cobrança com link para o cliente pagar online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gera link de pagamento automático</li>
                  <li>• Permite pagamento por cartão ou boleto</li>
                  <li>• Envio de lembretes</li>
                  <li>• Confirmação de pagamento em tempo real</li>
                </ul>
                <Button 
                  variant={selectedType === 'link' ? 'default' : 'outline'} 
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect('link');
                  }}
                >
                  {selectedType === 'link' ? 'Selecionado' : 'Selecionar'}
                </Button>
              </CardContent>
            </Card>
          )}

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
