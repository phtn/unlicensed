import { headers } from 'next/headers'
import { extractSubdomain } from './utils'
import { getSubdomainRoute } from './config'
import type { SubdomainInfo } from './utils'

/**
 * Get subdomain info in server components
 * Must be called in an async context
 */
export async function getSubdomain(): Promise<SubdomainInfo> {
  const headersList = await headers()
  const host = headersList.get('host') ?? headersList.get('x-forwarded-host') ?? 'localhost'
  return extractSubdomain(host)
}

/**
 * Get the current subdomain's route mapping
 */
export async function getSubdomainRouteFromHeaders(): Promise<string | null> {
  const { subdomain } = await getSubdomain()
  if (!subdomain) return null
  return getSubdomainRoute(subdomain)
}

/**
 * Check if we're on a specific subdomain in server components
 */
export async function isOnSubdomain(targetSubdomain: string): Promise<boolean> {
  const { subdomain } = await getSubdomain()
  return subdomain === targetSubdomain
}
