/**
 * Security headers and CORS configuration
 */

export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // XSS Protection
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // HTTPS Enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)'
  ].join(', ')
};

/**
 * Secure CORS configuration
 */
export const CORS_CONFIG = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://app.psiclo.com.br',
    /\.lovable\.app$/,
    /\.netlify\.app$/
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ]
};

/**
 * Apply security headers to Edge Function responses
 */
export const getSecureHeaders = (additionalHeaders: Record<string, string> = {}) => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...additionalHeaders
  };
};