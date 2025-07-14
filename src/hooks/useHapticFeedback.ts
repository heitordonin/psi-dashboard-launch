// Haptic feedback hook para dispositivos móveis
export const useHapticFeedback = () => {
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light') => {
    // Check if we're in a browser that supports haptic feedback
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // For devices that support the Vibration API
      if ('vibrate' in navigator) {
        const patterns = {
          light: 10,
          medium: 20,
          heavy: 50,
          selection: [10],
          success: [10, 50, 10],
          warning: [50, 50, 50],
          error: [100, 50, 100]
        };
        
        navigator.vibrate(patterns[type]);
      }
      
      // For iOS devices with haptic feedback support (Web Haptics API)
      if ('hapticFeedback' in navigator) {
        try {
          // @ts-ignore - Web Haptics API is experimental
          navigator.hapticFeedback?.({
            type: type === 'light' ? 'light' : type === 'heavy' ? 'heavy' : 'medium'
          });
        } catch (error) {
          console.debug('Haptic feedback not supported');
        }
      }
    }
  };

  return { triggerHaptic };
};