
import { LayoutDashboard, Banknote, Settings } from "lucide-react";
import { useLocation } from "react-router-dom";
import { 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const adminItems = [
  {
    title: "Dashboard Estratégico",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Central Financeira",
    url: "/admin/financials",
    icon: Banknote,
  },
  {
    title: "Configurações",
    url: "/payment-config",
    icon: Settings,
  },
];

export const AdminSection = () => {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {adminItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton size="sm" isActive={isActive} asChild>
                  <a href={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
