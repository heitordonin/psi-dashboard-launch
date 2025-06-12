
import { SidebarTrigger } from "@/components/ui/sidebar";

export const ProfileHeader = () => {
  return (
    <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-white hover:text-gray-200" />
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Perfil</h1>
          <p className="text-sm" style={{ color: '#03f6f9' }}>Gerencie suas informações pessoais</p>
        </div>
      </div>
    </div>
  );
};
