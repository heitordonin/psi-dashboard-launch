
import { Crown, CreditCard } from "lucide-react";
import { useLocation } from "react-router-dom";
import { 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const planosItems = [
  {
    title: "Planos",
    url: "/plans",
    icon: Crown,
  },
  {
    title: "Assinatura",
    url: "/plans/subscription",
    icon: CreditCard,
  },
];

export const PlanosSection = () => {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Planos</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {planosItems.map((item) => {
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
