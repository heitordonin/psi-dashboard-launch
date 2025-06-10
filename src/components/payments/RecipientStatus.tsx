
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface RecipientStatusProps {
  recipientId: string;
}

export const RecipientStatus = ({ recipientId }: RecipientStatusProps) => {
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
};
