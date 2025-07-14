import { cn } from "@/lib/utils";

interface EnhancedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'shimmer' | 'pulse' | 'bounce';
}

function EnhancedSkeleton({
  className,
  variant = 'shimmer',
  ...props
}: EnhancedSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        {
          'loading-shimmer': variant === 'shimmer',
          'loading-pulse': variant === 'pulse', 
          'loading-bounce': variant === 'bounce',
        },
        className
      )}
      {...props}
    />
  );
}

export { EnhancedSkeleton };