import { ReactNode } from "react";
import { EnhancedSkeleton } from "./enhanced-skeleton";

interface InfiniteScrollListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  isLoading?: boolean;
  hasMore?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
  className?: string;
}

export function InfiniteScrollList<T>({
  items,
  renderItem,
  isLoading = false,
  hasMore = true,
  loadingComponent,
  emptyComponent,
  className = ""
}: InfiniteScrollListProps<T>) {
  const LoadingIndicator = loadingComponent || (
    <div className="infinite-scroll-trigger">
      <div className="space-y-3 w-full">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-4">
            <EnhancedSkeleton variant="shimmer" className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <EnhancedSkeleton variant="pulse" className="h-4 w-3/4" />
              <EnhancedSkeleton variant="shimmer" className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const EmptyIndicator = emptyComponent || (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Nenhum item encontrado</p>
    </div>
  );

  if (items.length === 0 && !isLoading) {
    return <div className={className}>{EmptyIndicator}</div>;
  }

  return (
    <div className={className}>
      {items.map((item, index) => renderItem(item, index))}
      
      {isLoading && LoadingIndicator}
      
      {!hasMore && items.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Todos os itens foram carregados
          </p>
        </div>
      )}
    </div>
  );
}