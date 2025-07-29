import { Users, Upload, FileCheck } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const adminPsiRegularItems = [
  {
    title: "Painel Psi Regular",
    url: "/admin",
    icon: Users,
  },
  {
    title: "Controle de Obrigações",
    url: "/admin/controle-obrigacoes",
    icon: FileCheck,
  },
  {
    title: "Enviar Documentos",
    url: "/admin/enviar-documentos",
    icon: Upload,
  },
];

export const AdminPsiRegularSection = () => {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin Psi Regular</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {adminPsiRegularItems.map((item) => {
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