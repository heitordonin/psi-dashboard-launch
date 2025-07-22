
import { 
  Home,
  Users,
  CreditCard,
  FileText,
  Receipt,
  Crown,
  Mail,
  FolderOpen,
  Calendar
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { useSubscription } from "@/hooks/useSubscription";

const baseItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: Users,
  },
  {
    title: "Cobranças",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Despesas",
    url: "/expenses",
    icon: Receipt,
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: Calendar,
  },
  {
    title: "Controle Receita Saúde",
    url: "/receita-saude-control",
    icon: FileText,
  },
  {
    title: "Logs de Email",
    url: "/email-logs",
    icon: Mail,
  },
  {
    title: "Planos",
    url: "/plans",
    icon: Crown,
  },
];

const psiRegularItem = {
  title: "Documentos Recebidos",
  url: "/documentos-recebidos",
  icon: FolderOpen,
};

export const SidebarItems = () => {
  const location = useLocation();
  const { currentPlan } = useSubscription();

  // Add Documentos Recebidos if user has Psi Regular plan
  const items = [...baseItems];
  if (currentPlan?.slug === 'psi_regular') {
    items.splice(5, 0, psiRegularItem); // Insert after "Controle Receita Saúde"
  }

  return (
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
  );
};
