
import { Settings, AreaChart, Landmark } from "lucide-react";
import { useLocation } from "react-router-dom";
import { 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const psicloBankItems = [
  {
    title: "Configuração",
    url: "/psiclo-bank/configuracao",
    icon: Settings,
  },
  {
    title: "Gestão de Cobranças",
    url: "/psiclo-bank/gestao",
    icon: AreaChart,
  },
  {
    title: "Cadastro de Conta",
    url: "/psiclo-bank/cadastro-conta",
    icon: Landmark,
  },
];

export const PsicloBankSection = () => {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Psiclo Bank</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {psicloBankItems.map((item) => {
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
