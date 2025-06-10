
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Bank {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

interface BankData {
  bank_code: string;
  agency: string;
  agency_digit: string;
  account: string;
  account_digit: string;
  type: string;
}

interface BankAccountFormProps {
  banks: Bank[];
  banksLoading: boolean;
  bankData: BankData;
  setBankData: (data: BankData) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const BankAccountForm = ({
  banks,
  banksLoading,
  bankData,
  setBankData,
  onSubmit,
  loading
}: BankAccountFormProps) => {
  return (
    <div className="space-y-4">
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
        onClick={onSubmit}
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
    </div>
  );
};
