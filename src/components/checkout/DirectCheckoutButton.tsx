import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DirectCheckoutButtonProps {
  planSlug: string;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const DirectCheckoutButton = ({ 
  planSlug, 
  children, 
  variant = "default",
  size = "default",
  className = ""
}: DirectCheckoutButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/checkout?plan=${planSlug}`);
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      {children || (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Assinar Agora
        </>
      )}
    </Button>
  );
};

export default DirectCheckoutButton;