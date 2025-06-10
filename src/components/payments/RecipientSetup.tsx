
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useRecipientSetup } from "@/hooks/useRecipientSetup";
import { RecipientStatus } from "./RecipientStatus";
import { BankAccountForm } from "./BankAccountForm";

export const RecipientSetup = () => {
  const {
    loading,
    banksLoading,
    banks,
    recipientId,
    bankData,
    setBankData,
    handleCreateRecipient
  } = useRecipientSetup();

  if (recipientId) {
    return <RecipientStatus recipientId={recipientId} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Configurar Conta de Recebimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BankAccountForm
          banks={banks}
          banksLoading={banksLoading}
          bankData={bankData}
          setBankData={setBankData}
          onSubmit={handleCreateRecipient}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
};
