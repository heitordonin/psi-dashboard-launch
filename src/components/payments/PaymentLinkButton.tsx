
import { Link } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentLinkButtonProps {
  onClick: () => void;
}

export function PaymentLinkButton({ onClick }: PaymentLinkButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Link className="h-4 w-4 mr-2" />
      Ver Link
    </Button>
  );
}
