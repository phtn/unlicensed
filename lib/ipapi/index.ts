import {IpResponse} from './types'
/**
 * IPAPI
 * @description IP Address API and Geolocation service
 * @tutorial https://api.ipapi.com/91.196.152.100?access_key=7f0935383f1&format=1
 * @param {string} ip - IP address to query
 */

interface Geo {
  country: string
  city: string
}

// In-memory cache for IP addresses
const geoCache = new Map<string, Geo>()

/**
 * Get geo information for an IP address
 * First checks in-memory cache, then Convex database, and finally IPAPI
 * @param ip - IP address to query
 * @param checkConvex - Optional function to check Convex for existing geo data
 * @returns Geo information (country and city) or null if not found
 */
export async function getGeo(
  ip: string,
  checkConvex?: (ip: string) => Promise<Geo | null>,
): Promise<Geo | null> {
  // Skip if IP is invalid
  if (!ip || ip === 'unknown') {
    return null
  }

  // Check in-memory cache first
  const cached = geoCache.get(ip)
  if (cached) {
    return cached
  }

  // Check Convex database if function provided
  if (checkConvex) {
    try {
      const convexGeo = await checkConvex(ip)
      if (convexGeo) {
        // Cache the result
        geoCache.set(ip, convexGeo)
        return convexGeo
      }
    } catch (error) {
      // Silently fail and continue to IPAPI
      console.warn('Failed to check Convex for geo data:', error)
    }
  }

  // Fetch from IPAPI
  const apiUrl = process.env.IPAPI_PRO_URL
  const apiKey = process.env.IPAPI_API_KEY

  if (!apiUrl || !apiKey) {
    console.warn(
      'IPAPI environment variables not configured: IPAPI_PRO_URL and IPAPI_API_KEY required',
    )
    return null
  }

  try {
    // Ensure URL has trailing slash if needed
    const baseUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`
    const url = `${baseUrl}${ip}?access_key=${apiKey}&format=1`

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.warn(
        `IPAPI request failed for IP ${ip}: ${response.status} ${response.statusText} - ${errorText}`,
      )
      return null
    }

    const data = (await response.json()) as
      | IpResponse
      | {error?: {info?: string; code?: number}}

    // Check for API error in response (some APIs return errors in JSON with 200 status)
    if ('error' in data && data.error) {
      console.warn(
        `IPAPI returned error for IP ${ip}:`,
        data.error.code,
        data.error.info,
      )
      return null
    }

    // Validate response data
    if (
      !data ||
      !('country_name' in data) ||
      !data.country_name ||
      !data.city
    ) {
      console.warn(`IPAPI returned incomplete data for IP ${ip}:`, data)
      return null
    }

    const country =
      `${data.location?.country_flag_emoji_unicode || ''} ${data.country_name}`.trim()
    const city =
      `${data.city}${data.region_name ? `, ${data.region_name}` : ''}`.trim()

    if (!data.country_name || !data.city) {
      console.warn(`IPAPI returned empty geo data for IP ${ip}`)
      return null
    }

    const geo: Geo = {country, city}

    // Cache the result
    geoCache.set(ip, geo)
    return geo
  } catch (error) {
    console.warn(`Failed to fetch geo data from IPAPI for IP ${ip}:`, error)
    return null
  }
}
