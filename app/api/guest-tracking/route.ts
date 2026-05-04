import {api} from '@/convex/_generated/api'
import {verifyFirebaseSessionCookie} from '@/lib/firebase/server-auth'
import {firebaseSessionCookieName} from '@/lib/firebase/session'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'
import {createHmac} from 'node:crypto'
import z from 'zod'

export const runtime = 'nodejs'

const metadataValueSchema = z.union([
  z.string().max(500),
  z.number(),
  z.boolean(),
  z.null(),
])

const trackingPayloadSchema = z.object({
  visitorId: z.string().min(12).max(128),
  deviceFingerprintId: z.string().min(12).max(128).optional(),
  type: z.enum([
    'page_view',
    'identify',
    'cart_action',
    'checkout_step',
    'search',
    'custom',
  ]),
  path: z.string().min(1).max(500),
  fullPath: z.string().max(1000).optional(),
  title: z.string().max(200).optional(),
  referrer: z.string().max(1000).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional(),
  screenWidth: z.number().int().positive().max(100000).optional(),
  screenHeight: z.number().int().positive().max(100000).optional(),
  timezone: z.string().max(120).optional(),
  locale: z.string().max(80).optional(),
  consent: z.enum(['unknown', 'granted', 'denied']).optional(),
  metadata: z.record(z.string().max(80), metadataValueSchema).optional(),
})

type TrackingPayload = z.infer<typeof trackingPayloadSchema>
type MetadataValue = z.infer<typeof metadataValueSchema>

let cachedClient: ConvexHttpClient | null = null

function getConvexClient() {
  if (cachedClient) {
    return cachedClient
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL
  if (!convexUrl) {
    throw new Error('Convex URL is not configured.')
  }

  cachedClient = new ConvexHttpClient(convexUrl)
  return cachedClient
}

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null
}

function normalizeIpAddress(ipAddress: string | null) {
  if (!ipAddress) {
    return null
  }

  return ipAddress
    .replace(/^::ffff:/, '')
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split('%')[0]
    ?.trim()
}

function getClientIp(request: NextRequest) {
  const headers = request.headers
  return normalizeIpAddress(
    firstHeaderValue(headers.get('cf-connecting-ip')) ??
      firstHeaderValue(headers.get('x-real-ip')) ??
      firstHeaderValue(headers.get('x-forwarded-for')) ??
      firstHeaderValue(headers.get('x-vercel-forwarded-for')),
  )
}

function getIpNetwork(ipAddress: string | null) {
  if (!ipAddress) {
    return null
  }

  const ipv4Parts = ipAddress.split('.')
  if (
    ipv4Parts.length === 4 &&
    ipv4Parts.every((part) => /^\d{1,3}$/.test(part))
  ) {
    return `${ipv4Parts.slice(0, 3).join('.')}.0`
  }

  if (ipAddress.includes(':')) {
    const networkParts = ipAddress
      .toLowerCase()
      .split(':')
      .filter(Boolean)
      .slice(0, 4)

    return networkParts.length > 0 ? `${networkParts.join(':')}::` : null
  }

  return null
}

function hashSignal(label: string, signal: string | null | undefined) {
  const salt = process.env.GUEST_TRACKING_HASH_SALT
  if (!salt || !signal) {
    return undefined
  }

  return createHmac('sha256', salt).update(`${label}:${signal}`).digest('hex')
}

function parseDeviceType(
  userAgent: string,
): TrackingPayload['deviceType'] | undefined {
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) {
    return 'tablet'
  }

  if (/mobi|iphone|android/i.test(userAgent)) {
    return 'mobile'
  }

  return userAgent ? 'desktop' : undefined
}

function parseBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) return 'Edge'
  if (/opr\//i.test(userAgent)) return 'Opera'
  if (/chrome|crios/i.test(userAgent)) return 'Chrome'
  if (/firefox|fxios/i.test(userAgent)) return 'Firefox'
  if (/safari/i.test(userAgent)) return 'Safari'
  return undefined
}

function parseOs(userAgent: string) {
  if (/windows/i.test(userAgent)) return 'Windows'
  if (/iphone|ipad|ios/i.test(userAgent)) return 'iOS'
  if (/android/i.test(userAgent)) return 'Android'
  if (/mac os|macintosh/i.test(userAgent)) return 'macOS'
  if (/linux/i.test(userAgent)) return 'Linux'
  return undefined
}

function decodeHeaderValue(value: string | null) {
  if (!value) {
    return undefined
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getGeoHeaders(request: NextRequest) {
  return {
    country:
      decodeHeaderValue(request.headers.get('x-vercel-ip-country')) ??
      decodeHeaderValue(request.headers.get('cf-ipcountry')),
    region: decodeHeaderValue(
      request.headers.get('x-vercel-ip-country-region'),
    ),
    city: decodeHeaderValue(request.headers.get('x-vercel-ip-city')),
  }
}

function sanitizeMetadata(metadata: TrackingPayload['metadata']) {
  if (!metadata) {
    return undefined
  }

  const entries = Object.entries(metadata).flatMap(([key, value]) => {
    const safeKey = key
      .trim()
      .replace(/[^A-Za-z0-9.:-]/g, '-')
      .slice(0, 80)

    if (!safeKey || safeKey.startsWith('$') || safeKey.startsWith('_')) {
      return []
    }

    const safeValue: MetadataValue =
      typeof value === 'string' ? value.slice(0, 500) : value

    return [[safeKey, safeValue] as const]
  })

  return entries.length > 0
    ? Object.fromEntries(entries.slice(0, 25))
    : undefined
}

async function getLinkedUserFid(request: NextRequest) {
  const sessionCookie = request.cookies.get(firebaseSessionCookieName)?.value
  if (!sessionCookie) {
    return undefined
  }

  try {
    const user = await verifyFirebaseSessionCookie(sessionCookie)
    return user?.uid
  } catch {
    return undefined
  }
}

export async function POST(request: NextRequest) {
  let payload: TrackingPayload

  try {
    payload = trackingPayloadSchema.parse(await request.json())
  } catch {
    return NextResponse.json({error: 'Invalid tracking payload'}, {status: 400})
  }

  if (payload.consent === 'denied') {
    return new NextResponse(null, {status: 204})
  }

  const userAgent = request.headers.get('user-agent') ?? ''
  const clientHints = [
    request.headers.get('sec-ch-ua'),
    request.headers.get('sec-ch-ua-mobile'),
    request.headers.get('sec-ch-ua-platform'),
  ]
    .filter(Boolean)
    .join('|')
  const ipNetwork = getIpNetwork(getClientIp(request))
  const geo = getGeoHeaders(request)
  const linkedUserFid = await getLinkedUserFid(request)
  const deviceType = payload.deviceType ?? parseDeviceType(userAgent)
  const browser = parseBrowser(userAgent)
  const os = parseOs(userAgent)
  const ipNetworkHash = hashSignal('ip-network', ipNetwork)
  const userAgentHash = hashSignal('user-agent', userAgent)
  const clientHintsHash = hashSignal('client-hints', clientHints)
  const metadata = sanitizeMetadata(payload.metadata)

  try {
    await getConvexClient().mutation(api.guestTracking.m.recordEvent, {
      visitorId: payload.visitorId,
      ...(payload.deviceFingerprintId
        ? {deviceFingerprintId: payload.deviceFingerprintId}
        : {}),
      type: payload.type,
      path: payload.path,
      ...(payload.fullPath ? {fullPath: payload.fullPath} : {}),
      ...(payload.title ? {title: payload.title} : {}),
      ...(payload.referrer ? {referrer: payload.referrer} : {}),
      ...(payload.utmSource ? {utmSource: payload.utmSource} : {}),
      ...(payload.utmMedium ? {utmMedium: payload.utmMedium} : {}),
      ...(payload.utmCampaign ? {utmCampaign: payload.utmCampaign} : {}),
      ...(payload.utmTerm ? {utmTerm: payload.utmTerm} : {}),
      ...(payload.utmContent ? {utmContent: payload.utmContent} : {}),
      ...(deviceType ? {deviceType} : {}),
      ...(browser ? {browser} : {}),
      ...(os ? {os} : {}),
      ...(payload.screenWidth ? {screenWidth: payload.screenWidth} : {}),
      ...(payload.screenHeight ? {screenHeight: payload.screenHeight} : {}),
      ...(payload.timezone ? {timezone: payload.timezone} : {}),
      ...(payload.locale ? {locale: payload.locale} : {}),
      ...(geo.country ? {country: geo.country} : {}),
      ...(geo.region ? {region: geo.region} : {}),
      ...(geo.city ? {city: geo.city} : {}),
      ...(ipNetworkHash ? {ipNetworkHash} : {}),
      ...(userAgentHash ? {userAgentHash} : {}),
      ...(clientHintsHash ? {clientHintsHash} : {}),
      ...(linkedUserFid ? {linkedUserFid} : {}),
      ...(payload.consent ? {consent: payload.consent} : {}),
      ...(metadata ? {metadata} : {}),
    })

    return NextResponse.json({ok: true})
  } catch (error) {
    console.error('Failed to record guest tracking event:', error)
    return NextResponse.json(
      {error: 'Unable to record tracking event'},
      {status: 500},
    )
  }
}
