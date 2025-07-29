import { Users } from "lucide-react";
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