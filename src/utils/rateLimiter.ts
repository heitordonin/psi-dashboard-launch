/**
 * Rate limiting utilities for API endpoints
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Create a rate limiter function
 */
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  return (key: string): boolean => {
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    // Reset if window has passed
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    // Check if limit exceeded
    if (record.count >= maxAttempts) {
      return false;
    }
    
    // Increment count
    record.count++;
    return true;
  };
};

/**
 * Rate limiter for Stripe operations (max 10 per minute per user)
 */
export const stripeRateLimiter = createRateLimiter(10, 60 * 1000);

/**
 * Rate limiter for authentication operations (max 5 per minute per IP)
 */
export const authRateLimiter = createRateLimiter(5, 60 * 1000);

/**
 * Rate limiter for admin operations (max 20 per minute per user)
 */
export const adminRateLimiter = createRateLimiter(20, 60 * 1000);

/**
 * Clear expired rate limit records (should be called periodically)
 */
export const cleanupExpiredRecords = () => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Cleanup expired records every 5 minutes
setInterval(cleanupExpiredRecords, 5 * 60 * 1000);