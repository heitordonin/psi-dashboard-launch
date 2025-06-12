
import * as React from "react";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarItems } from "@/components/sidebar/SidebarItems";
import { PsicloBankSection } from "@/components/sidebar/PsicloBankSection";
import { AdminSection } from "@/components/sidebar/AdminSection";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAdmin } = useAuth();
  const { currentPlan } = useSubscription();

  console.log('AppSidebar - isAdmin:', isAdmin, 'user:', user?.email);

  // Show Psiclo Bank section only for paid plans (not free)
  const showPsicloBankSection = currentPlan?.slug !== 'free';

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
        {isAdmin && <AdminSection />}
        <SidebarFooter />
      </SidebarContent>
    </Sidebar>
  );
}
