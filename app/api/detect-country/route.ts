import {api} from '@/convex/_generated/api'
import {getGeo} from '@/lib/ipapi'
import {type DetectedUserLocation} from '@/lib/user-location'
import {cleanIpAddress, getClientIp} from '@/utils/fingerprint'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

const getConvexClient = () => {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return null
  return new ConvexHttpClient(url)
}

const getCountryName = (countryCode: string) => {
  try {
    const displayNames = new Intl.DisplayNames(['en'], {type: 'region'})
    return (
      displayNames.of(countryCode.toUpperCase()) ?? countryCode.toUpperCase()
    )
  } catch {
    return countryCode.toUpperCase()
  }
}

const unknownLocation = (): DetectedUserLocation => ({
  country: null,
  countryCode: null,
  city: null,
  latitude: null,
  longitude: null,
  source: 'unknown',
})

const parseCoordinate = (value: string | null) => {
  if (!value) return null

  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) {
    return null
  }

  return parsed
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<DetectedUserLocation | null> {
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', `${latitude}`)
  url.searchParams.set('lon', `${longitude}`)
  url.searchParams.set('zoom', '5')
  url.searchParams.set('addressdetails', '1')

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'hyfe-location-detector/1.0',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as {
    address?: {
      city?: string
      country?: string
      country_code?: string
      state?: string
      town?: string
      village?: string
    }
  }

  const address = data.address
  if (!address?.country) {
    return null
  }

  return {
    country: address.country,
    countryCode: address.country_code?.toUpperCase() ?? null,
    city:
      address.city ?? address.town ?? address.village ?? address.state ?? null,
    latitude,
    longitude,
    source: 'browser',
  }
}

function getHeaderLocation(request: NextRequest): DetectedUserLocation | null {
  const countryCode =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry')
  const normalizedCountryCode = countryCode?.trim().toUpperCase() ?? null

  if (
    !normalizedCountryCode ||
    normalizedCountryCode === 'XX' ||
    normalizedCountryCode === 'T1'
  ) {
    return null
  }

  const city = request.headers.get('x-vercel-ip-city')?.trim() ?? null

  return {
    country: getCountryName(normalizedCountryCode),
    countryCode: normalizedCountryCode,
    city,
    latitude: null,
    longitude: null,
    source: 'header',
  }
}

async function getIpLocation(
  request: NextRequest,
): Promise<DetectedUserLocation | null> {
  const ipAddress = cleanIpAddress(getClientIp(request))
  if (!ipAddress || ipAddress === 'unknown') {
    return null
  }

  const client = getConvexClient()
  let ipapiEnabled = Boolean(
    process.env.IPAPI_API_KEY && process.env.IPAPI_PRO_URL,
  )

  if (client) {
    try {
      ipapiEnabled = await client.query(
        api.admin.q.getIpapiGeolocationEnabled,
        {},
      )
    } catch (error) {
      console.warn(
        'Failed to read IPAPI geolocation setting for detect-country route:',
        error,
      )
    }
  }

  const checkConvexGeo = client
    ? async (ip: string) => {
        const result = await client.query(api.logs.q.getGeoByIp, {
          ipAddress: ip,
        })
        if (!result?.country && !result?.city) {
          return null
        }

        return {
          country: result.country ?? '',
          city: result.city ?? '',
        }
      }
    : undefined

  const geo = await getGeo(ipAddress, checkConvexGeo, ipapiEnabled)
  if (!geo) {
    return null
  }

  const country = geo.country.trim()
  const city = geo.city.trim()

  if (!country && !city) {
    return null
  }

  return {
    country: country || null,
    countryCode: geo.countryCode ?? null,
    city: city || null,
    latitude: geo.latitude ?? null,
    longitude: geo.longitude ?? null,
    source: 'ip',
  }
}

async function detectLocation(
  request: NextRequest,
): Promise<DetectedUserLocation> {
  const latitude = parseCoordinate(request.nextUrl.searchParams.get('latitude'))
  const longitude = parseCoordinate(
    request.nextUrl.searchParams.get('longitude'),
  )

  if (latitude !== null && longitude !== null) {
    const browserLocation = await reverseGeocode(latitude, longitude)
    if (browserLocation) {
      return browserLocation
    }
  }

  const headerLocation = getHeaderLocation(request)
  if (headerLocation) {
    return headerLocation
  }

  const ipLocation = await getIpLocation(request)
  if (ipLocation) {
    return ipLocation
  }

  return unknownLocation()
}

export async function GET(request: NextRequest) {
  const location = await detectLocation(request)

  return NextResponse.json(location, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
