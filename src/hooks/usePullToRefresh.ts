import { useState, useCallback, useRef } from 'react';

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
}

export const usePullToRefresh = ({ 
  onRefresh, 
  threshold = 80, 
  resistance = 2.5 
}: UsePullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Only trigger if we're at the top of the page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY !== 0) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY / resistance, threshold * 1.5);
      setPullDistance(distance);
      
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${distance}px)`;
      }
    }
  }, [resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateY(0)';
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isPulling: pullDistance > 0,
    isTriggered: pullDistance > threshold,
    bindTouchEvents: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }
  };
};