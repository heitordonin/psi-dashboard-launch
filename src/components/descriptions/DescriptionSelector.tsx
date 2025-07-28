import { useIsMobile } from "@/hooks/use-mobile";
import { DescriptionSelectorMobile } from "./DescriptionSelectorMobile";
import { DescriptionSelectorDesktop } from "./DescriptionSelectorDesktop";

interface DescriptionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDescription: (description: string) => void;
  onManageDescriptions: () => void;
}

export const DescriptionSelector = (props: DescriptionSelectorProps) => {
  const isMobile = useIsMobile();
  
  return isMobile ? (
    <DescriptionSelectorMobile {...props} />
  ) : (
    <DescriptionSelectorDesktop {...props} />
  );
};