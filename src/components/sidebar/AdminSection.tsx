
import { LayoutDashboard, Upload, Activity, BarChart3, Users } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
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
    title: "Painel Movimento",
    url: "/admin/movimento",
    icon: BarChart3,
  },
  {
    title: "Dashboard Estratégico",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Monitoramento",
    url: "/admin/subscription-monitoring",
    icon: Activity,
  },
  {
    title: "Planos Cortesia",
    url: "/admin/courtesy-plans",
    icon: Users,
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
                  <Link to={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
