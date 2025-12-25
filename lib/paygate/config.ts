/**
 * PayGate configuration
 * 
 * Configuration can come from:
 * 1. Environment variables (server-side only)
 * 2. Admin settings (database, can override env vars)
 * 
 * **Using Self-Hosted Proxy Server (White-Label)**:
 * Configure your OWN subdomains that point to your proxy server:
 * - PAYGATE_API_URL=https://api.yourdomain.com (YOUR subdomain, not PayGate's)
 * - PAYGATE_CHECKOUT_URL=https://checkout.yourdomain.com (YOUR subdomain, not PayGate's)
 * - NEXT_PUBLIC_PAYGATE_API_URL and NEXT_PUBLIC_PAYGATE_CHECKOUT_URL for client-side access
 * 
 * The proxy server (server/paygate-proxy/index.ts) handles routing to PayGate API internally.
 * Your app never directly contacts PayGate - all requests go through your proxy subdomains.
 */

// Server-side environment variables (not exposed to client)
export const paygateConfig = {
  // API URLs - YOUR subdomains when using proxy server, or PayGate defaults when not
  // Example with proxy: https://api.yourdomain.com (points to your proxy server)
  // Example without proxy: https://api.paygate.to (direct PayGate API)
  apiUrl: process.env.PAYGATE_API_URL || 'https://api.paygate.to',
  checkoutUrl: process.env.PAYGATE_CHECKOUT_URL || 'https://checkout.paygate.to',
  
  // USDC Polygon wallet address for receiving payments
  // Note: When using proxy server, wallet is typically configured in proxy server env vars
  // and automatically injected by the proxy, so this may not be needed
  usdcWallet: process.env.PAYGATE_USDC_WALLET || '',
  
  // Webhook secret for verifying webhook requests (optional)
  webhookSecret: process.env.PAYGATE_WEBHOOK_SECRET || '',
  
  // Enable/disable PayGate integration
  enabled: process.env.PAYGATE_ENABLED !== 'false', // Default to enabled if not set
} as const

// Client-side configuration (public URLs only)
// MUST match your proxy server subdomains when using self-hosted proxy
export const paygatePublicConfig = {
  // YOUR subdomain URLs (e.g., https://api.yourdomain.com) - NOT PayGate's domains
  apiUrl: process.env.NEXT_PUBLIC_PAYGATE_API_URL || 'https://api.paygate.to',
  checkoutUrl: process.env.NEXT_PUBLIC_PAYGATE_CHECKOUT_URL || 'https://checkout.paygate.to',
} as const
