export type UserLocationSource = 'browser' | 'header' | 'ip' | 'unknown'

export interface DetectedUserLocation {
  country: string | null
  countryCode: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  source: UserLocationSource
}

export const USER_COUNTRY_COOKIE = 'x-user-country'
export const USER_COUNTRY_CODE_COOKIE = 'x-user-country-code'
export const USER_CITY_COOKIE = 'x-user-city'
export const USER_LOCATION_SOURCE_COOKIE = 'x-user-location-source'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export function isDetectedUserLocation(
  value: unknown,
): value is DetectedUserLocation {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    ('country' in candidate &&
      (candidate.country === null || typeof candidate.country === 'string')) &&
    ('countryCode' in candidate &&
      (candidate.countryCode === null ||
        typeof candidate.countryCode === 'string')) &&
    ('city' in candidate &&
      (candidate.city === null || typeof candidate.city === 'string')) &&
    ('latitude' in candidate &&
      (candidate.latitude === null ||
        typeof candidate.latitude === 'number')) &&
    ('longitude' in candidate &&
      (candidate.longitude === null ||
        typeof candidate.longitude === 'number')) &&
    (candidate.source === 'browser' ||
      candidate.source === 'header' ||
      candidate.source === 'ip' ||
      candidate.source === 'unknown')
  )
}

function writeCookie(name: string, value: string | null) {
  if (typeof document === 'undefined') {
    return
  }

  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : ''

  if (!value) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure}`
    return
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

export function setUserLocationCookies(location: DetectedUserLocation | null) {
  writeCookie(USER_COUNTRY_COOKIE, location?.country ?? null)
  writeCookie(USER_COUNTRY_CODE_COOKIE, location?.countryCode ?? null)
  writeCookie(USER_CITY_COOKIE, location?.city ?? null)
  writeCookie(USER_LOCATION_SOURCE_COOKIE, location?.source ?? null)
}
