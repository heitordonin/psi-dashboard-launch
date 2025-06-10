
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { RecipientSetup } from "@/components/payments/RecipientSetup";

const PaymentConfig = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">Configuração de Pagamentos</h1>
              <p className="text-gray-600">
                Configure sua conta de recebimento para processar pagamentos através do Pagar.me.
              </p>
            </div>
            
            <RecipientSetup />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PaymentConfig;
