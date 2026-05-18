import {api} from '@/convex/_generated/api'
import {requireStaffAdminRequest} from '@/lib/firebase/server-auth'
import {
  IPINFO_IDENTIFIER,
  type IpinfoService,
  parseIpinfoConfig,
} from '@/lib/ipinfo/config'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

export const runtime = 'nodejs'

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? null

let convexClient: ConvexHttpClient | null = null

function getConvexClient() {
  if (!convexUrl) {
    return null
  }

  if (!convexClient) {
    convexClient = new ConvexHttpClient(convexUrl)
  }

  return convexClient
}

function getEnvTokenForService(service: IpinfoService) {
  switch (service) {
    case 'lite':
      return process.env.IPINFO_LITE_TOKEN?.trim() || null
    case 'core':
      return process.env.IPINFO_CORE_TOKEN?.trim() || null
    case 'plus':
      return process.env.IPINFO_PLUS_TOKEN?.trim() || null
    case 'max':
      return process.env.IPINFO_MAX_TOKEN?.trim() || null
  }
}

function getEndpointForService(service: IpinfoService, ip: string) {
  const encodedIp = encodeURIComponent(ip)
  return service === 'lite' ? `/lite/${encodedIp}` : `/lookup/${encodedIp}`
}

export const GET = async (req: NextRequest) => {
  const auth = await requireStaffAdminRequest(req)
  if (!auth.ok) {
    return auth.response
  }

  const {searchParams} = new URL(req.url)
  const ip = searchParams.get('ip')?.trim()

  if (!ip) {
    return NextResponse.json(
      {error: 'Missing ip query parameter'},
      {status: 400},
    )
  }

  const convex = getConvexClient()
  const setting = convex
    ? await convex.query(api.admin.q.getAdminByIdentifier, {
        identifier: IPINFO_IDENTIFIER,
      })
    : null
  const config = parseIpinfoConfig(setting?.value)
  const service = config.enabledService
  const token = config[service].token.trim() || getEnvTokenForService(service)

  if (!token) {
    return NextResponse.json(
      {error: `No token configured for IPinfo ${service}`},
      {status: 500},
    )
  }

  const baseUrl = 'https://api.ipinfo.io'
  const endpoint = `${getEndpointForService(service, ip)}?token=${encodeURIComponent(token)}`
  const res = await fetch(baseUrl + endpoint, {cache: 'no-store'})

  if (!res.ok) {
    return NextResponse.json(
      {error: 'Failed to fetch IP details from IPinfo'},
      {status: res.status},
    )
  }

  return NextResponse.json({
    ...(await res.json()),
    _service: service,
  })
}
