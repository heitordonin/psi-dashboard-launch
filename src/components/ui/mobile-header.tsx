import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { User, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const MobileHeader = ({ title, subtitle, className = "" }: MobileHeaderProps) => {
  const navigate = useNavigate();
  
  // Safe sidebar usage - check if sidebar context is available
  let hasSidebarContext = true;
  try {
    useSidebar();
  } catch {
    hasSidebarContext = false;
  }

  return (
    <div 
      style={{ backgroundColor: '#002472' }} 
      className={`border-b px-4 py-4 md:hidden ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {hasSidebarContext ? (
            <SidebarTrigger className="text-white hover:text-gray-200" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:text-gray-200 hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            {subtitle && (
              <p className="text-sm" style={{ color: '#03f6f9' }}>{subtitle}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/profile")}
          className="text-white hover:text-gray-200 hover:bg-white/10"
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};