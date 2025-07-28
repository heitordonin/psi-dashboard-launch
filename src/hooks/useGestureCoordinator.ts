import { useRef, useCallback } from 'react';

interface GestureCoordinatorOptions {
  enableSwipe?: boolean;
  enablePull?: boolean;
  swipeThreshold?: number;
  pullThreshold?: number;
}

interface GestureCoordinatorReturn {
  isSwipeActive: boolean;
  isPullActive: boolean;
  lockSwipe: () => void;
  unlockSwipe: () => void;
  lockPull: () => void;
  unlockPull: () => void;
  resetAll: () => void;
}

export const useGestureCoordinator = (
  options: GestureCoordinatorOptions = {}
): GestureCoordinatorReturn => {
  const {
    enableSwipe = true,
    enablePull = true,
    swipeThreshold = 100,
    pullThreshold = 80
  } = options;

  const swipeLocked = useRef(false);
  const pullLocked = useRef(false);
  const activeGesture = useRef<'swipe' | 'pull' | null>(null);

  const lockSwipe = useCallback(() => {
    swipeLocked.current = true;
  }, []);

  const unlockSwipe = useCallback(() => {
    swipeLocked.current = false;
    if (activeGesture.current === 'swipe') {
      activeGesture.current = null;
    }
  }, []);

  const lockPull = useCallback(() => {
    pullLocked.current = true;
  }, []);

  const unlockPull = useCallback(() => {
    pullLocked.current = false;
    if (activeGesture.current === 'pull') {
      activeGesture.current = null;
    }
  }, []);

  const resetAll = useCallback(() => {
    swipeLocked.current = false;
    pullLocked.current = false;
    activeGesture.current = null;
  }, []);

  return {
    isSwipeActive: enableSwipe && !swipeLocked.current && activeGesture.current !== 'pull',
    isPullActive: enablePull && !pullLocked.current && activeGesture.current !== 'swipe',
    lockSwipe,
    unlockSwipe,
    lockPull,
    unlockPull,
    resetAll
  };
};