
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentItem } from "./PaymentItem";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { ThumbZoneActions } from "@/components/ui/thumb-zone-actions";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { PullToRefreshContainer } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentsListProps {
  payments: PaymentWithPatient[];
  isLoading: boolean;
  onDeletePayment: (paymentId: string) => void;
  onEditPayment: (payment: Payment) => void;
  onAddPayment: () => void;
  onRefresh?: () => Promise<void>;
  hasFilters?: boolean;
}

export const PaymentsList = ({
  payments,
  isLoading,
  onDeletePayment,
  onEditPayment,
  onAddPayment,
  onRefresh,
  hasFilters = false
}: PaymentsListProps) => {
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();

  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      triggerHaptic('light');
      await onRefresh?.();
      triggerHaptic('success');
    }
  });

  const handleAddPayment = () => {
    triggerHaptic('light');
    onAddPayment();
  };

  const LoadingState = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <EnhancedSkeleton variant="shimmer" className="h-4 w-3/4" />
                  <EnhancedSkeleton variant="pulse" className="h-3 w-1/2" />
                </div>
                <EnhancedSkeleton variant="bounce" className="h-8 w-16" />
              </div>
              <EnhancedSkeleton variant="shimmer" className="h-3 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const EmptyState = () => (
    <Card>
      <CardContent className="text-center py-8">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          {hasFilters
            ? 'Nenhuma cobrança encontrada com os filtros aplicados' 
            : 'Nenhuma cobrança cadastrada'
          }
        </p>
        {!isMobile && (
          <Button onClick={handleAddPayment} variant="outline" className="touch-target">
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira cobrança
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (payments.length === 0) {
    return (
      <>
        <EmptyState />
        {isMobile && (
          <>
            <ThumbZoneActions>
              <Button onClick={handleAddPayment} className="flex-1 touch-target">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira cobrança
              </Button>
            </ThumbZoneActions>
            <FloatingActionButton onClick={handleAddPayment}>
              <Plus className="w-5 h-5" />
            </FloatingActionButton>
          </>
        )}
      </>
    );
  }

  const content = (
    <>
      <div className="space-y-4">
        {payments.map((payment) => (
          <PaymentItem
            key={payment.id}
            payment={payment}
            onEdit={onEditPayment}
            onDelete={onDeletePayment}
          />
        ))}
      </div>
      
      {isMobile && (
        <FloatingActionButton onClick={handleAddPayment}>
          <Plus className="w-5 h-5" />
        </FloatingActionButton>
      )}
    </>
  );

  if (isMobile && onRefresh) {
    return (
      <div ref={pullToRefresh.containerRef}>
        <PullToRefreshContainer
          onRefresh={onRefresh}
          isRefreshing={pullToRefresh.isRefreshing}
          pullDistance={pullToRefresh.pullDistance}
          isTriggered={pullToRefresh.isTriggered}
        >
          {content}
        </PullToRefreshContainer>
      </div>
    );
  }

  return content;
};
