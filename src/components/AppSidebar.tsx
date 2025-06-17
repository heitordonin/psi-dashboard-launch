
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
  const { user, isLoading, isAdmin } = useSecureAuth();
  const { currentPlan } = useSubscription();

  // Memoizar os valores calculados para evitar recálculos desnecessários
  const isAdminUser = React.useMemo(() => {
    return !isLoading && !!user && isAdmin;
  }, [isLoading, user, isAdmin]);

  const showPsicloBankSection = React.useMemo(() => {
    return isAdminUser && currentPlan?.slug !== 'gratis';
  }, [isAdminUser, currentPlan?.slug]);

  if (import.meta.env.MODE === 'development') {
    console.log('AppSidebar state:', {
      hasUser: !!user,
      isLoading,
      isAdmin,
      isAdminUser,
      currentPlan: currentPlan?.slug
    });
  }

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
