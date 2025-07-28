import { useState, useRef, useEffect } from 'react';

interface UseSwipeGestureProps {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
}

export const useSwipeGesture = ({ 
  onSwipeRight, 
  onSwipeLeft, 
  threshold = 50 
}: UseSwipeGestureProps) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      isDragging.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      
      currentX.current = e.touches[0].clientX;
      const deltaX = currentX.current - startX.current;
      
      if (Math.abs(deltaX) > 10) {
        // Only prevent default if the event is cancelable
        if (e.cancelable) {
          e.preventDefault();
        }
        
        if (deltaX > 0) {
          element.style.transform = `translateX(${Math.min(deltaX, 80)}px)`;
        } else {
          element.style.transform = `translateX(${Math.max(deltaX, -80)}px)`;
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging.current) return;
      
      const deltaX = currentX.current - startX.current;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          setSwipeDirection('right');
          setIsSwiped(true);
          onSwipeRight?.();
        } else {
          setSwipeDirection('left');
          setIsSwiped(true);
          onSwipeLeft?.();
        }
      } else {
        // Reset position if threshold not met
        element.style.transform = 'translateX(0)';
      }
      
      isDragging.current = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      startX.current = e.clientX;
      isDragging.current = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      currentX.current = e.clientX;
      const deltaX = currentX.current - startX.current;
      
      if (Math.abs(deltaX) > 10) {
        if (deltaX > 0) {
          element.style.transform = `translateX(${Math.min(deltaX, 80)}px)`;
        } else {
          element.style.transform = `translateX(${Math.max(deltaX, -80)}px)`;
        }
      }
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      
      const deltaX = currentX.current - startX.current;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          setSwipeDirection('right');
          setIsSwiped(true);
          onSwipeRight?.();
        } else {
          setSwipeDirection('left');
          setIsSwiped(true);
          onSwipeLeft?.();
        }
      } else {
        element.style.transform = 'translateX(0)';
      }
      
      isDragging.current = false;
    };

    // Touch events
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    // Mouse events for desktop testing
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [onSwipeRight, onSwipeLeft, threshold]);

  const resetSwipe = () => {
    setIsSwiped(false);
    setSwipeDirection(null);
    if (elementRef.current) {
      elementRef.current.style.transform = 'translateX(0)';
    }
  };

  return {
    elementRef,
    isSwiped,
    swipeDirection,
    resetSwipe
  };
};