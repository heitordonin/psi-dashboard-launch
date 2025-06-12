
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
  const { toggleSidebar } = useSidebar();

  return (
    <BaseSidebarHeader>
      <div className="flex items-center justify-between">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-sidebar-primary-foreground">
                  <img 
                    src="/lovable-uploads/dd8b5b26-acf5-48d0-8293-7f42227c7b84.png" 
                    alt="Psiclo" 
                    className="size-6"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Psiclo</span>
                  <span className="truncate text-xs">
                    {currentPlan?.name || 'Grátis'}
                  </span>
                </div>
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
