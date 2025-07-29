
import { Home, Users, Mail, FolderOpen } from "lucide-react";
import { useLocation } from "react-router-dom";
import { 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { useSubscription } from "@/hooks/useSubscription";

const baseGestaoItems = [
  {
    title: "Dashboard Inicial",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: Users,
  },
  {
    title: "Logs de Email",
    url: "/email-logs",
    icon: Mail,
  },
];

const psiRegularItem = {
  title: "Documentos Recebidos",
  url: "/documentos-recebidos",
  icon: FolderOpen,
};

export const GestaoSection = () => {
  const location = useLocation();
  const { currentPlan } = useSubscription();

  // Add Documentos Recebidos if user has Psi Regular plan
  const items = [...baseGestaoItems];
  if (currentPlan?.slug === 'psi_regular') {
    items.push(psiRegularItem);
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Gestão</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
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
