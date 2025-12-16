/**
 * PayGate configuration
 * 
 * Configuration can come from:
 * 1. Environment variables (server-side only)
 * 2. Admin settings (database, can override env vars)
 */

// Server-side environment variables (not exposed to client)
export const paygateConfig = {
  // API URLs - can be custom domain or default
  apiUrl: process.env.PAYGATE_API_URL || 'https://api.paygate.to',
  checkoutUrl: process.env.PAYGATE_CHECKOUT_URL || 'https://checkout.paygate.to',
  
  // USDC Polygon wallet address for receiving payments
  usdcWallet: process.env.PAYGATE_USDC_WALLET || '',
  
  // Webhook secret for verifying webhook requests (optional)
  webhookSecret: process.env.PAYGATE_WEBHOOK_SECRET || '',
  
  // Enable/disable PayGate integration
  enabled: process.env.PAYGATE_ENABLED !== 'false', // Default to enabled if not set
} as const

// Client-side configuration (public URLs only)
export const paygatePublicConfig = {
  // Public API URL (can be custom domain)
  apiUrl: process.env.NEXT_PUBLIC_PAYGATE_API_URL || 'https://api.paygate.to',
  checkoutUrl: process.env.NEXT_PUBLIC_PAYGATE_CHECKOUT_URL || 'https://checkout.paygate.to',
} as const
