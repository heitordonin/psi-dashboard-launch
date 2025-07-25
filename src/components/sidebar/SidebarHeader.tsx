
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { 
  SidebarHeader as BaseSidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";
import { useSubscription } from "@/hooks/useSubscription";

export const SidebarHeader = () => {
  const { currentPlan } = useSubscription();
  const { toggleSidebar, state } = useSidebar();
  
  const isCollapsed = state === "collapsed";

  return (
    <BaseSidebarHeader>
      <div className="flex items-center justify-between">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex h-8 w-auto items-center justify-center rounded-lg bg-white px-1 text-sidebar-primary-foreground">
                  <img 
                    src={isCollapsed ? "/lovable-uploads/18da7efa-7d56-4b55-b243-88c9b1abe19c.png" : "/lovable-uploads/e6f9033c-f43e-415a-8567-d1a99319fb47.png"}
                    alt="Psiclo" 
                    className={isCollapsed ? "h-6 w-6" : "h-6 w-auto"}
                  />
                </div>
                {!isCollapsed && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Psiclo</span>
                    <span className="truncate text-xs">
                      {currentPlan?.name || 'Grátis'}
                    </span>
                  </div>
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </BaseSidebarHeader>
  );
};
