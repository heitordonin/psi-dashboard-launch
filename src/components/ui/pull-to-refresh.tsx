import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
  pullDistance: number;
  isTriggered: boolean;
  className?: string;
}

export function PullToRefreshIndicator({ 
  isRefreshing, 
  pullDistance, 
  isTriggered 
}: Pick<PullToRefreshProps, 'isRefreshing' | 'pullDistance' | 'isTriggered'>) {
  const opacity = Math.min(pullDistance / 60, 1);
  const rotation = isRefreshing ? 'rotate-0' : `rotate-${Math.min(pullDistance * 2, 180)}`;
  
  return (
    <div 
      className={cn(
        "absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full",
        "flex items-center justify-center w-12 h-12 bg-background rounded-full shadow-lg",
        "transition-all duration-200 ease-out",
        isTriggered && "bg-primary text-primary-foreground"
      )}
      style={{ 
        opacity,
        transform: `translateX(-50%) translateY(${pullDistance - 48}px)`
      }}
    >
      {isRefreshing ? (
        <RefreshCw className="w-5 h-5 animate-spin" />
      ) : (
        <ArrowDown 
          className={cn("w-5 h-5 transition-transform duration-200", rotation)} 
        />
      )}
    </div>
  );
}

export function PullToRefreshContainer({ 
  children, 
  isRefreshing, 
  pullDistance, 
  isTriggered,
  className 
}: PullToRefreshProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <PullToRefreshIndicator 
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        isTriggered={isTriggered}
      />
      
      <div 
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`
        }}
      >
        {children}
      </div>
      
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-16 bg-muted/50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Atualizando...
          </div>
        </div>
      )}
    </div>
  );
}