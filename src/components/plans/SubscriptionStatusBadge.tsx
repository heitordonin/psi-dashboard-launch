import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface SubscriptionStatusBadgeProps {
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  cancelAtPeriodEnd?: boolean;
  expiresAt?: string | null;
}

export const SubscriptionStatusBadge = ({ 
  status, 
  cancelAtPeriodEnd = false, 
  expiresAt 
}: SubscriptionStatusBadgeProps) => {
  // If active but cancelled at period end, show different status
  if (status === 'active' && cancelAtPeriodEnd) {
    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300">
        <Clock className="w-3 h-3 mr-1" />
        Cancelada (ativa até {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'fim do período'})
      </Badge>
    );
  }

  const statusConfig = {
    active: {
      label: 'Ativa',
      className: 'bg-green-50 text-green-800 border-green-300',
      icon: CheckCircle
    },
    trial: {
      label: 'Período Trial',
      className: 'bg-blue-50 text-blue-800 border-blue-300',
      icon: Clock
    },
    cancelled: {
      label: 'Cancelada',
      className: 'bg-red-50 text-red-800 border-red-300',
      icon: XCircle
    },
    expired: {
      label: 'Expirada',
      className: 'bg-gray-50 text-gray-800 border-gray-300',
      icon: AlertTriangle
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};