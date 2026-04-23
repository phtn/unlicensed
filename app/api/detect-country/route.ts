import {type DetectedUserLocation} from '@/lib/user-location'
import {NextRequest, NextResponse} from 'next/server'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

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
      'User-Agent': 'RapidFire-location-detector/1.0',
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
