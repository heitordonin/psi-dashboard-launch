
import { User, LogOut, Share2, HeadphonesIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  SidebarFooter as BaseSidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/SupabaseAuthContext";

const bottomItems = [
  {
    title: "Indique um amigo",
    url: "/referral",
    icon: Share2,
  },
  {
    title: "Central de Suporte",
    url: "/suporte",
    icon: HeadphonesIcon,
  },
];

export const SidebarFooter = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Outros</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {bottomItems.map((item) => {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton size="sm" asChild>
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
      <BaseSidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild>
              <a href="/profile">
                <User className="size-4" />
                <span>Perfil</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" onClick={handleSignOut}>
              <LogOut className="size-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </BaseSidebarFooter>
    </>
  );
};
