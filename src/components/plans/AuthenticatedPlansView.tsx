import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SubscriptionPlan } from "@/types/subscription";
import AuthenticatedPlanCard from "./AuthenticatedPlanCard";

interface AuthenticatedPlansViewProps {
  plans: SubscriptionPlan[];
  currentPlan?: SubscriptionPlan;
}

const AuthenticatedPlansView = ({ plans, currentPlan }: AuthenticatedPlansViewProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                    Planos de Assinatura
                  </h1>
                  <p className="text-sm" style={{ color: '#03f6f9' }}>
                    Escolha o plano ideal para sua prática
                  </p>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-4 py-8">
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <AuthenticatedPlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={currentPlan?.id === plan.id}
                  />
                ))}
              </div>

              <div className="mt-8 text-center text-sm text-gray-500">
                <p>* Serviços marcados com asterisco são realizados externamente pela nossa equipe</p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AuthenticatedPlansView;