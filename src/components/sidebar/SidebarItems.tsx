
import { 
  Home,
  Users,
  CreditCard,
  FileText,
  Receipt,
  Crown,
  Mail
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const items = [
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

export const SidebarItems = () => {
  const location = useLocation();

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
