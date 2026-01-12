import { SUBDOMAIN_CONFIG, isReservedSubdomain, isAllowedDomain } from './config'

export interface SubdomainInfo {
  subdomain: string | null
  domain: string
  isSubdomain: boolean
}

/**
 * Extracts subdomain information from a hostname
 */
export function extractSubdomain(hostname: string): SubdomainInfo {
  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0]

  // Check if this is an allowed domain
  if (!isAllowedDomain(hostWithoutPort)) {
    return { subdomain: null, domain: hostWithoutPort, isSubdomain: false }
  }

  // Find the matching root domain
  const matchingDomain = SUBDOMAIN_CONFIG.allowedDomains.find(
    (allowed) => hostWithoutPort === allowed || hostWithoutPort.endsWith(`.${allowed}`)
  )

  if (!matchingDomain) {
    return { subdomain: null, domain: hostWithoutPort, isSubdomain: false }
  }

  // If it's exactly the root domain, no subdomain
  if (hostWithoutPort === matchingDomain) {
    return { subdomain: null, domain: matchingDomain, isSubdomain: false }
  }

  // Extract subdomain
  const subdomain = hostWithoutPort.replace(`.${matchingDomain}`, '')

  // Check if it's a reserved subdomain
  if (isReservedSubdomain(subdomain)) {
    return { subdomain: null, domain: matchingDomain, isSubdomain: false }
  }

  return { subdomain, domain: matchingDomain, isSubdomain: true }
}

/**
 * Gets the current subdomain from headers (for use in server components)
 */
export function getSubdomainFromHeaders(headersList: Headers): SubdomainInfo {
  const host = headersList.get('host') ?? headersList.get('x-forwarded-host') ?? 'localhost'
  return extractSubdomain(host)
}

/**
 * Builds a URL with a subdomain
 */
export function buildSubdomainUrl(
  subdomain: string,
  domain: string,
  path = '/',
  protocol = 'https'
): string {
  const port = domain === 'localhost' ? ':3000' : ''
  const proto = domain === 'localhost' ? 'http' : protocol
  return `${proto}://${subdomain}.${domain}${port}${path}`
}
