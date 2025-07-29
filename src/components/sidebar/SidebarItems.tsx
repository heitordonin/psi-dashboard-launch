
import { GestaoSection } from "@/components/sidebar/sections/GestaoSection";
import { FinanceiroSection } from "@/components/sidebar/sections/FinanceiroSection";
import { AgendaSection } from "@/components/sidebar/sections/AgendaSection";
import { PlanosSection } from "@/components/sidebar/sections/PlanosSection";
import { OutrosSection } from "@/components/sidebar/sections/OutrosSection";
import { AdminPsiRegularSection } from "@/components/sidebar/sections/AdminPsiRegularSection";

export const SidebarItems = () => {
  return (
    <>
      <GestaoSection />
      <FinanceiroSection />
      <AgendaSection />
      <PlanosSection />
      <AdminPsiRegularSection />
      <OutrosSection />
    </>
  );
};
