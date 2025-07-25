
import { LayoutDashboard, Users, Upload, Activity } from "lucide-react";
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
    title: "Painel Administrativo",
    url: "/admin",
    icon: Users,
  },
  {
    title: "Dashboard Estratégico",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Enviar Documentos",
    url: "/admin/enviar-documentos",
    icon: Upload,
  },
  {
    title: "Monitoramento",
    url: "/admin/subscription-monitoring",
    icon: Activity,
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
