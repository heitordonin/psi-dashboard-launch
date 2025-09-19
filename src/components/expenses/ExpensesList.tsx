import { Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ExpenseTable } from "./ExpenseTable";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { ThumbZoneActions } from "@/components/ui/thumb-zone-actions";
import { PullToRefreshContainer } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePagination } from "@/hooks/usePagination";
import type { ExpenseWithCategory } from "@/types/expense";

interface ExpensesListProps {
  expenses: ExpenseWithCategory[];
  isLoading: boolean;
  onDeleteExpense: (expenseId: string) => void;
  onEditExpense: (expense: ExpenseWithCategory) => void;
  onAddExpense: () => void;
  onRefresh?: () => Promise<void>;
  hasFilters?: boolean;
  isFormOpen?: boolean;
}

export const ExpensesList = ({
  expenses,
  isLoading,
  onDeleteExpense,
  onEditExpense,
  onAddExpense,
  onRefresh,
  hasFilters = false,
  isFormOpen = false
}: ExpensesListProps) => {
  const isMobile = useIsMobile();
  const {
    triggerHaptic
  } = useHapticFeedback();
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData: paginatedExpenses,
    goToPage,
    nextPage,
    previousPage,
    changeItemsPerPage,
    hasNextPage,
    hasPreviousPage
  } = usePagination({
    data: expenses,
    defaultItemsPerPage: 25
  });

  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      triggerHaptic('light');
      await onRefresh?.();
      triggerHaptic('success');
    }
  });

  const handleAddExpense = () => {
    triggerHaptic('light');
    onAddExpense();
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
        <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          {hasFilters ? 'Nenhuma despesa encontrada com os filtros aplicados' : 'Nenhuma despesa cadastrada'}
        </p>
        {!isMobile && (
          <Button onClick={handleAddExpense} variant="outline" className="touch-target">
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira despesa
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (expenses.length === 0) {
    return (
      <>
        <EmptyState />
        {isMobile && (
          <>
            <ThumbZoneActions>
              <Button onClick={handleAddExpense} className="flex-1 touch-target">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira despesa
              </Button>
            </ThumbZoneActions>
          </>
        )}
      </>
    );
  }

  const content = (
    <>
      {/* Tabela de despesas */}
      <ExpenseTable 
        expenses={paginatedExpenses}
        onEdit={onEditExpense}
        onDelete={onDeleteExpense}
      />

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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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