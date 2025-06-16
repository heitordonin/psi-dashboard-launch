
import * as React from "react";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarItems } from "@/components/sidebar/SidebarItems";
import { PsicloBankSection } from "@/components/sidebar/PsicloBankSection";
import { AdminSection } from "@/components/sidebar/AdminSection";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, canPerformAdminAction, isLoading, isAdminLoading } = useSecureAuth();
  const { currentPlan } = useSubscription();

  if (import.meta.env.MODE === 'development') {
    console.log('AppSidebar state:', {
      hasUser: !!user,
      isLoading,
      isAdminLoading,
      canPerformAdminAction: canPerformAdminAction(),
      currentPlan: currentPlan?.slug
    });
  }

  // Don't show admin sections while loading or admin verification is in progress
  const isVerificationComplete = !isLoading && !isAdminLoading;
  const isAdminUser = isVerificationComplete && canPerformAdminAction();

  // Show Psiclo Bank section only for paid plans (not gratis) AND admin users AND verification complete
  const showPsicloBankSection = isVerificationComplete && currentPlan?.slug !== 'gratis' && isAdminUser;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarItems />
          </SidebarGroupContent>
        </SidebarGroup>
        {showPsicloBankSection && <PsicloBankSection />}
        {isAdminUser && <AdminSection />}
        <SidebarFooter />
      </SidebarContent>
    </Sidebar>
  );
}
