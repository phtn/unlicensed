/**
 * Subdomain configuration for the Next.js app
 * Maps subdomains to their corresponding app routes
 */

export const SUBDOMAIN_CONFIG = {
  /**
   * Available subdomains and their route mappings
   */
  subdomains: {
    admin: '/admin',
    account: '/account',
    // Add more subdomains as needed
  },

  /**
   * The main/root domain (no subdomain)
   * Requests to this will serve the root app
   */
  rootDomain: 'localhost',

  /**
   * Domains where subdomain routing should be active
   * Add your production domains here
   */
  allowedDomains: [
    'localhost',
    'rapidfirenow.com',
    'rapid-fire-online.vercel.app',
  ],

  /**
   * Reserved subdomains that should not be routed
   * These will be treated as the root domain
   */
  reservedSubdomains: ['www'],
} as const

export type SubdomainKey = keyof typeof SUBDOMAIN_CONFIG.subdomains

export function getSubdomainRoute(subdomain: string): string | null {
  const key = subdomain as SubdomainKey
  return SUBDOMAIN_CONFIG.subdomains[key] ?? null
}

export function isReservedSubdomain(subdomain: string): boolean {
  return SUBDOMAIN_CONFIG.reservedSubdomains.includes(
    subdomain as (typeof SUBDOMAIN_CONFIG.reservedSubdomains)[number],
  )
}

export function isAllowedDomain(domain: string): boolean {
  return SUBDOMAIN_CONFIG.allowedDomains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  )
}
