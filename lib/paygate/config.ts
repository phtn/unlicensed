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
  checkoutUrl:
    process.env.PAYGATE_CHECKOUT_URL || 'https://checkout.paygate.to',

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
  checkoutUrl:
    process.env.NEXT_PUBLIC_PAYGATE_CHECKOUT_URL ||
    'https://checkout.paygate.to',
} as const

export type GatewayId = 'paygate' | 'paylex' | 'rampex'

export type GatewayUrlRecord = {apiUrl?: string; checkoutUrl?: string}

/**
 * Server-side: get API and checkout URLs for the given gateway.
 * **Primary source**: Convex gateway document (api.gateways.q.getByGateway) — pass gateway.apiUrl, gateway.checkoutUrl.
 * **Fallback**: env vars, then hardcoded defaults.
 *
 * @param gateway - Gateway identifier (paygate | paylex | rampex)
 * @param gatewayRecord - From Convex gateways table (api.gateways.q.getByGateway). Callers must query and pass.
 */
export function getGatewayApiUrls(
  gateway: GatewayId,
  gatewayRecord?: GatewayUrlRecord | null,
): {apiUrl: string; checkoutUrl: string} {
  const parseUrls = (r: GatewayUrlRecord | null | undefined) => ({
    apiUrl: (r?.apiUrl?.trim() && r.apiUrl) || undefined,
    checkoutUrl: (r?.checkoutUrl?.trim() && r.checkoutUrl) || undefined,
  })
  const {apiUrl: recordApi, checkoutUrl: recordCheckout} =
    parseUrls(gatewayRecord)

  switch (gateway) {
    case 'paygate':
      return {
        apiUrl:
          recordApi || process.env.PAYGATE_API_URL || 'https://api.paygate.to',
        checkoutUrl:
          recordCheckout ||
          process.env.PAYGATE_CHECKOUT_URL ||
          'https://checkout.paygate.to',
      }
    case 'paylex':
      return {
        apiUrl:
          recordApi || process.env.PAYLEX_API_URL || 'https://api.paylex.org',
        checkoutUrl:
          recordCheckout ||
          process.env.PAYLEX_CHECKOUT_URL ||
          'https://checkout.paylex.org',
      }
    case 'rampex':
      return {
        apiUrl:
          recordApi || process.env.RAMPEX_API_URL || 'https://api.rampex.io',
        checkoutUrl:
          recordCheckout ||
          process.env.RAMPEX_CHECKOUT_URL ||
          'https://checkout.rampex.io',
      }
    default:
      return {
        apiUrl: process.env.PAYGATE_API_URL || 'https://api.paygate.to',
        checkoutUrl:
          process.env.PAYGATE_CHECKOUT_URL || 'https://checkout.paygate.to',
      }
  }
}
