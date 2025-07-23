
import * as React from "react";
import { 
  Sidebar,
  SidebarContent
} from "@/components/ui/sidebar";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarItems } from "@/components/sidebar/SidebarItems";
import { PsicloBankSection } from "@/components/sidebar/PsicloBankSection";
import { AdminSection } from "@/components/sidebar/AdminSection";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, canPerformAdminAction } = useSecureAuth();
  const { currentPlan } = useSubscription();

  if (import.meta.env.MODE === 'development') {
    console.log('AppSidebar - canPerformAdminAction:', canPerformAdminAction(), 'user:', user?.email);
  }

  // Show Psiclo Bank section only for paid plans (not gratis) AND admin users
  const showPsicloBankSection = currentPlan?.slug !== 'gratis' && canPerformAdminAction();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader />
      <SidebarContent>
        <SidebarItems />
        {showPsicloBankSection && <PsicloBankSection />}
        {canPerformAdminAction() && <AdminSection />}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
