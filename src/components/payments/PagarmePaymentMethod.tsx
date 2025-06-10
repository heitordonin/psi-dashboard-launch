
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PagarmePaymentMethodProps {
  paymentId: string;
  amount: number;
  onSuccess: (data: any) => void;
}

export const PagarmePaymentMethod = ({ paymentId, amount, onSuccess }: PagarmePaymentMethodProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [processing, setProcessing] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [cardData, setCardData] = useState({
    number: '',
    holder_name: '',
    exp_month: '',
    exp_year: '',
    cvv: ''
  });

  const handleCreateTransaction = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pagarme-transaction', {
        body: {
          payment_id: paymentId,
          payment_method: paymentMethod,
          card_data: paymentMethod === 'credit_card' ? cardData : undefined
        }
      });

      if (error) throw error;

      if (data.success) {
        if (paymentMethod === 'pix' && data.pix_qr_code) {
          setPixQrCode(data.pix_qr_code);
        }
        onSuccess(data);
        toast.success('Pagamento criado com sucesso!');
      } else {
        throw new Error(data.error || 'Erro ao criar pagamento');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Erro ao criar pagamento: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  if (pixQrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pagamento PIX Criado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border inline-block">
              <div className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
                {pixQrCode}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Escaneie o QR Code acima ou copie o código PIX para efetuar o pagamento
            </p>
            <p className="text-lg font-bold mt-2">
              Valor: R$ {amount.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Método de Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Selecione o método de pagamento</Label>
          <Select value={paymentMethod} onValueChange={(value: 'pix' | 'credit_card') => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod === 'credit_card' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-number">Número do Cartão</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={cardData.number}
                onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="card-name">Nome no Cartão</Label>
              <Input
                id="card-name"
                placeholder="Nome como está no cartão"
                value={cardData.holder_name}
                onChange={(e) => setCardData({ ...cardData, holder_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="exp-month">Mês</Label>
                <Select value={cardData.exp_month} onValueChange={(value) => setCardData({ ...cardData, exp_month: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="exp-year">Ano</Label>
                <Select value={cardData.exp_year} onValueChange={(value) => setCardData({ ...cardData, exp_year: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="AAAA" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  maxLength={4}
                  value={cardData.cvv}
                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-4">
          <div className="text-lg font-bold mb-4">
            Total: R$ {amount.toFixed(2)}
          </div>
          
          <Button 
            onClick={handleCreateTransaction}
            disabled={processing}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {paymentMethod === 'pix' ? (
                  <QrCode className="w-4 h-4 mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                {paymentMethod === 'pix' ? 'Gerar PIX' : 'Pagar com Cartão'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
