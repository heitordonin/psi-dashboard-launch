import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, FileText } from 'lucide-react';

interface AdminStatsCardsProps {
  stats: {
    totalPatients: number;
    totalPayments: number;
    totalRevenue: number;
    totalExpenseAmount: number;
  } | undefined;
  showAllUsers: boolean;
}

export const AdminStatsCards = ({ stats, showAllUsers }: AdminStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* KPIs removidos conforme solicitado */}
    </div>
  );
};