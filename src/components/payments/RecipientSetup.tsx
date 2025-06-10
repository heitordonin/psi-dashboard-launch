
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/SupabaseAuthContext";

interface Bank {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export const RecipientSetup = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [bankData, setBankData] = useState({
    bank_code: '',
    agency: '',
    agency_digit: '',
    account: '',
    account_digit: '',
    type: 'conta_corrente'
  });

  useEffect(() => {
    checkRecipientStatus();
    loadBanks();
  }, [user]);

  const loadBanks = async () => {
    try {
      setBanksLoading(true);
      const { data, error } = await supabase
        .from('banks')
        .select('id, code, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setBanks(data || []);
    } catch (error) {
      console.error('Error loading banks:', error);
      toast.error('Erro ao carregar lista de bancos');
    } finally {
      setBanksLoading(false);
    }
  };

  const checkRecipientStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('pagarme_recipient_id, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.pagarme_recipient_id) {
        setRecipientId(data.pagarme_recipient_id);
      }
    } catch (error) {
      console.error('Error checking recipient status:', error);
    }
  };

  const handleCreateRecipient = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user profile for full_name and cpf
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, cpf')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.full_name || !profile?.cpf) {
        toast.error('Por favor, complete seu perfil com nome completo e CPF antes de configurar pagamentos.');
        return;
      }

      // Map account type from Portuguese to English
      const accountType = bankData.type === 'conta_corrente' ? 'checking' : 'savings';

      // Send flat payload with correct English field names
      const { data, error } = await supabase.functions.invoke('create-pagarme-recipient', {
        body: {
          legal_name: profile.full_name,
          cpf: profile.cpf,
          bank_code: bankData.bank_code,
          agency_number: bankData.agency,
          agency_digit: bankData.agency_digit || undefined,
          account_number: bankData.account,
          account_digit: bankData.account_digit,
          account_type: accountType
        }
      });

      if (error) throw error;

      if (data.success) {
        setRecipientId(data.recipient_id);
        toast.success('Conta de recebimento criada com sucesso!');
        
        // Clear form
        setBankData({
          bank_code: '',
          agency: '',
          agency_digit: '',
          account: '',
          account_digit: '',
          type: 'conta_corrente'
        });
      } else {
        throw new Error(data.error || 'Erro ao criar conta de recebimento');
      }
    } catch (error) {
      console.error('Error creating recipient:', error);
      toast.error('Erro ao criar conta de recebimento: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (recipientId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Conta de Recebimento Configurada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Sua conta de recebimento Pagar.me está configurada e pronta para receber pagamentos.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            ID do Recebedor: {recipientId}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Configurar Conta de Recebimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Para receber pagamentos, você precisa configurar sua conta bancária.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bank-select">Banco</Label>
            <Select 
              value={bankData.bank_code} 
              onValueChange={(value) => setBankData({ ...bankData, bank_code: value })}
              disabled={banksLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={banksLoading ? "Carregando bancos..." : "Selecione seu banco"} />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.code}>
                    {bank.name} - {bank.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="account-type">Tipo da Conta</Label>
            <Select value={bankData.type} onValueChange={(value) => setBankData({ ...bankData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                <SelectItem value="conta_poupanca">Conta Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="agency">Agência</Label>
            <Input
              id="agency"
              placeholder="1234"
              value={bankData.agency}
              onChange={(e) => setBankData({ ...bankData, agency: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="agency-digit">Dígito Agência</Label>
            <Input
              id="agency-digit"
              placeholder="5"
              value={bankData.agency_digit}
              onChange={(e) => setBankData({ ...bankData, agency_digit: e.target.value })}
            />
          </div>

          <div className="col-span-1">
            {/* Empty space for alignment */}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="account">Conta</Label>
            <Input
              id="account"
              placeholder="12345678"
              value={bankData.account}
              onChange={(e) => setBankData({ ...bankData, account: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="account-digit">Dígito da Conta</Label>
            <Input
              id="account-digit"
              placeholder="9"
              value={bankData.account_digit}
              onChange={(e) => setBankData({ ...bankData, account_digit: e.target.value })}
            />
          </div>
        </div>

        <Button 
          onClick={handleCreateRecipient}
          disabled={loading || !bankData.bank_code || !bankData.agency || !bankData.account || banksLoading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar Conta de Recebimento'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
