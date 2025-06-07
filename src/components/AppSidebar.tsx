
import * as React from "react";
import {
  Home,
  Users,
  CreditCard,
  FileText,
  Settings,
  Receipt,
  Crown,
  Share2,
  LogOut
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { 
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useSubscription } from "@/hooks/useSubscription";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentPlan } = useSubscription();

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
      title: "Planos",
      url: "/plans",
      icon: Crown,
    },
  ];

  const adminItems = [
    {
      title: "Admin",
      url: "/admin",
      icon: Settings,
    },
  ];

  const bottomItems = [
    {
      title: "Indique um amigo",
      url: "/referral",
      icon: Share2,
    },
    {
      title: "Sair",
      onClick: () => {
        signOut();
        navigate("/login");
      },
      icon: LogOut,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <img 
                    src="/lovable-uploads/dd8b5b26-acf5-48d0-8293-7f42227c7b84.png" 
                    alt="Psiclo" 
                    className="size-6"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Psiclo</span>
                  <span className="truncate text-xs">
                    {currentPlan?.name || 'Freemium'}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarMenu>
        {items.map((item) => {
          const active = location.pathname === item.url;
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton size="sm" active={active} asChild>
                <a href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
      {user?.email === 'admin@psiclo.com.br' && (
        <SidebarMenu heading="Admin">
          {adminItems.map((item) => {
            const active = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton size="sm" active={active} asChild>
                  <a href={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      )}
      <SidebarMenu heading="Outros">
        {bottomItems.map((item) => {
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton size="sm" asChild onClick={item.onClick}>
                {item.url ? (
                  <a href={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </a>
                ) : (
                  <>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </Sidebar>
  );
}
