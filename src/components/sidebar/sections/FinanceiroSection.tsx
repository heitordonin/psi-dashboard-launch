
import { CreditCard, Receipt, FileText, FolderOpen } from "lucide-react";
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

const baseFinanceiroItems = [
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
];

const psiRegularItem = {
  title: "Documentos Recebidos",
  url: "/documentos-recebidos",
  icon: FolderOpen,
};

export const FinanceiroSection = () => {
  const location = useLocation();
  const { currentPlan } = useSubscription();

  // Add Documentos Recebidos if user has Psi Regular plan
  const items = [...baseFinanceiroItems];
  if (currentPlan?.slug === 'psi_regular') {
    items.push(psiRegularItem);
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
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
