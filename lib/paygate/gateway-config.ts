/**
 * Multi-gateway config (PayGate, Paylex, Rampex — same process, different providers).
 * Client-side URLs only; use env vars for each gateway when using a proxy.
 */

export type GatewayId = 'paygate' | 'paylex' | 'rampex'

export interface GatewayPublicConfig {
  apiUrl: string
  checkoutUrl: string
}

const PAYGATE = {
  apiUrl: process.env.NEXT_PUBLIC_PAYGATE_API_URL || 'https://api.paygate.to',
  checkoutUrl:
    process.env.NEXT_PUBLIC_PAYGATE_CHECKOUT_URL || 'https://checkout.paygate.to',
} as const

const PAYLEX = {
  apiUrl: process.env.NEXT_PUBLIC_PAYLEX_API_URL || 'https://api.paylex.to',
  checkoutUrl:
    process.env.NEXT_PUBLIC_PAYLEX_CHECKOUT_URL || 'https://checkout.paylex.to',
} as const

const RAMPEX = {
  apiUrl: process.env.NEXT_PUBLIC_RAMPEX_API_URL || 'https://api.rampex.to',
  checkoutUrl:
    process.env.NEXT_PUBLIC_RAMPEX_CHECKOUT_URL || 'https://checkout.rampex.to',
} as const

export function getGatewayPublicConfig(
  gateway: GatewayId,
): GatewayPublicConfig {
  switch (gateway) {
    case 'paygate':
      return PAYGATE
    case 'paylex':
      return PAYLEX
    case 'rampex':
      return RAMPEX
    default:
      return PAYGATE
  }
}
