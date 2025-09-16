
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { PaymentItem } from "./PaymentItem";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { ThumbZoneActions } from "@/components/ui/thumb-zone-actions";
import { PullToRefreshContainer } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePagination } from "@/hooks/usePagination";
import type { Payment, PaymentWithPatient } from "@/types/payment";

interface PaymentsListProps {
  payments: PaymentWithPatient[];
  isLoading: boolean;
  onDeletePayment: (paymentId: string) => void;
  onEditPayment: (payment: Payment) => void;
  onAddPayment: () => void;
  onRefresh?: () => Promise<void>;
  hasFilters?: boolean;
  isWizardOpen?: boolean;
}

export const PaymentsList = ({
  payments,
  isLoading,
  onDeletePayment,
  onEditPayment,
  onAddPayment,
  onRefresh,
  hasFilters = false,
  isWizardOpen = false
}: PaymentsListProps) => {
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData: paginatedPayments,
    goToPage,
    nextPage,
    previousPage,
    changeItemsPerPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination({ data: payments, defaultItemsPerPage: 25 });

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
          </>
        )}
      </>
    );
  }

  const content = (
    <>
      {/* Section Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cobranças a Receber</h2>
          <p className="text-sm text-gray-600">{payments.length} cobranças</p>
        </div>
        <button className="text-primary hover:text-primary/80 text-sm font-medium underline-offset-4 hover:underline transition-colors">
          + Gerar nova cobrança
        </button>
      </div>

      {/* Items per page selector */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Itens por página:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => changeItemsPerPage(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-600">
          {payments.length > 0 && `${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, payments.length)} de ${payments.length}`}
        </div>
      </div>

      <div className="space-y-4">
        {paginatedPayments.map((payment) => (
          <PaymentItem
            key={payment.id}
            payment={payment}
            onEdit={onEditPayment}
            onDelete={onDeletePayment}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => previousPage()}
                  className={hasPreviousPage ? "cursor-pointer" : "pointer-events-none opacity-50"}
                />
              </PaginationItem>
              
              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => nextPage()}
                  className={hasNextPage ? "cursor-pointer" : "pointer-events-none opacity-50"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
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
