
import { GestaoSection } from "@/components/sidebar/sections/GestaoSection";
import { FinanceiroSection } from "@/components/sidebar/sections/FinanceiroSection";
import { AgendaSection } from "@/components/sidebar/sections/AgendaSection";
import { PlanosSection } from "@/components/sidebar/sections/PlanosSection";
import { OutrosSection } from "@/components/sidebar/sections/OutrosSection";
import { useSecureProfile } from "@/hooks/useSecureProfile";

export const SidebarItems = () => {
  const { profile } = useSecureProfile();
  
  return (
    <>
      <GestaoSection />
      <FinanceiroSection />
      {profile?.agenda_module_enabled && <AgendaSection />}
      <PlanosSection />
      <OutrosSection />
    </>
  );
};
