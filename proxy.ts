import {api} from '@/convex/_generated/api'
import {getGeo} from '@/lib/ipapi'
import {
  cleanIpAddress,
  getClientIp,
  getScreenHeight,
  getScreenWidth,
  getUserAgent,
} from '@/utils/fingerprint'
import {parseUserAgent} from '@/utils/user-agent'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

// Initialize Convex client for server-side logging
const getConvexClient = () => {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return null
  return new ConvexHttpClient(url)
}

/**
 * Middleware to capture and log all site visits
 *
 * This middleware runs on every request and logs visit information
 * to the Convex logs table. It runs asynchronously to avoid blocking requests.
 */
export async function proxy(request: NextRequest) {
  const startTime = Date.now()

  // Get response to measure response time
  const response = NextResponse.next()

  // Additional security headers
  const securityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy for sensitive features
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'bluetooth=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
    ].join(', '),

    // Remove server information
    'X-Powered-By': '',

    // Security headers for API routes
    ...(request.nextUrl.pathname.startsWith('/api') && {
      'Cache-Control': 'no-store, max-age=0',
    }),
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    }
  })

  // Skip logging for certain paths (static assets, API routes that handle their own logging, etc.)
  const path = request.nextUrl.pathname

  // Skip paths that start with these prefixes
  const skipPaths = [
    '/_next',
    '/api/logs', // Prevent infinite loops if we add a logs API
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ]

  // Skip image and SVG file extensions
  const imageExtensions = [
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.ico',
    '.bmp',
    '.tiff',
    '.avif',
    '.heic',
    '.heif',
  ]

  const isImageAsset = imageExtensions.some((ext) =>
    path.toLowerCase().endsWith(ext),
  )
  const shouldSkipPath = skipPaths.some((skipPath) => path.startsWith(skipPath))
  const shouldSkip = shouldSkipPath || isImageAsset

  if (!shouldSkip) {
    // Log visit asynchronously (fire and forget)
    logVisit(request, startTime).catch((error) => {
      // Silently fail to avoid breaking the request
      console.error('Failed to log visit:', error)
    })
  }

  return response
}

async function logVisit(request: NextRequest, startTime: number) {
  try {
    const client = getConvexClient()
    if (!client) {
      console.warn('Convex URL not configured, skipping visit log')
      return
    }

    const url = request.nextUrl
    const rawIpAddress = getClientIp(request)
    // Clean IP address before using it for geo lookup and storage
    const ipAddress = cleanIpAddress(rawIpAddress)
    const userAgent = getUserAgent(request)
    const parsedUA = parseUserAgent(userAgent)

    // Extract query parameters
    const queryParams: Record<string, unknown> = {}
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    // Get referrer
    const referrer = request.headers.get('referer') || undefined
    const origin = request.headers.get('origin') || undefined

    // Calculate response time (approximate)
    const responseTime = Date.now() - startTime

    // Get session ID from cookies if available
    const sessionId = request.cookies.get('sessionId')?.value

    // Note: User ID would need to be extracted from auth token if available
    // For now, we'll leave it as optional and can be set later via client-side tracking
    const userId = undefined

    // Get geo information (country and city) for the IP address
    // This will check cache, then Convex, then IPAPI
    // Note: IP is already cleaned before this call
    const checkConvexGeo = async (ip: string) => {
      try {
        const result = await client.query(api.logs.q.getGeoByIp, {
          ipAddress: ip,
        })
        if (result && result.country && result.city) {
          return {
            country: result.country,
            city: result.city,
          }
        }
        return null
      } catch (error) {
        console.warn(`Failed to check Convex for geo data for IP ${ip}:`, error)
        return null
      }
    }

    const geo = await getGeo(ipAddress, checkConvexGeo)

    // Log if geo lookup failed for debugging
    if (!geo && ipAddress && ipAddress !== 'unknown') {
      console.warn(
        `Failed to get geo data for IP: ${ipAddress}. Check IPAPI configuration.`,
      )
    }

    // Log the visit
    await client.mutation(api.logs.m.createLog, {
      type: 'page_visit',
      method: request.method,
      path: url.pathname,
      fullUrl: url.toString(),
      queryParams:
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
      userId: userId,
      sessionId: sessionId,
      ipAddress: ipAddress,
      userAgent: userAgent,
      referrer: referrer,
      origin: origin,
      screenWidth: getScreenWidth(request),
      screenHeight: getScreenHeight(request),
      deviceType: parsedUA.deviceType,
      browser: parsedUA.browser,
      browserVersion: parsedUA.browserVersion,
      os: parsedUA.os,
      osVersion: parsedUA.osVersion,
      country: geo?.country,
      city: geo?.city,
      statusCode: 200, // Will be updated if we can capture actual status
      responseTime: responseTime,
      createdAt: Date.now(),
    })
  } catch (error) {
    // Log error but don't throw to avoid breaking the request
    console.error('Error logging visit:', error)
  }
}

export const config = {
  // Match all request paths except static files and API routes that handle their own logging
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
