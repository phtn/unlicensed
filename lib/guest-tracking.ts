export const GUEST_VISITOR_ID_COOKIE_NAME = 'rapidfire_guest_visitor_id'
export const GUEST_VISITOR_ID_STORAGE_KEY = 'rapidfire:guestVisitorId'
export const GUEST_TRACKING_OPT_OUT_STORAGE_KEY =
  'rapidfire:guestTrackingOptOut'
export const GUEST_VISITOR_ID_MAX_AGE = 60 * 60 * 24 * 180

const getCookieString = () =>
  typeof document === 'undefined' ? '' : document.cookie

export function createGuestVisitorId() {
  const randomId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

  return `gv_${randomId}`
}

export function normalizeGuestVisitorId(visitorId?: string | null) {
  const normalized = visitorId?.trim()
  return normalized && normalized.length >= 12 && normalized.length <= 128
    ? normalized
    : null
}

export function getGuestVisitorIdCookie() {
  const cookieEntry = getCookieString()
    .split('; ')
    .find((entry) => entry.startsWith(`${GUEST_VISITOR_ID_COOKIE_NAME}=`))

  if (!cookieEntry) {
    return null
  }

  const [, rawValue = ''] = cookieEntry.split('=')

  try {
    return normalizeGuestVisitorId(decodeURIComponent(rawValue))
  } catch {
    return normalizeGuestVisitorId(rawValue)
  }
}

export function setGuestVisitorIdCookie(visitorId: string) {
  if (typeof document === 'undefined') {
    return
  }

  const normalizedVisitorId = normalizeGuestVisitorId(visitorId)
  if (!normalizedVisitorId) {
    return
  }

  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; secure'
      : ''

  document.cookie = `${GUEST_VISITOR_ID_COOKIE_NAME}=${encodeURIComponent(normalizedVisitorId)}; path=/; max-age=${GUEST_VISITOR_ID_MAX_AGE}; samesite=lax${secure}`
}

export function getOrCreateGuestVisitorId() {
  if (typeof window === 'undefined') {
    return null
  }

  const existingStorageId = normalizeGuestVisitorId(
    window.localStorage.getItem(GUEST_VISITOR_ID_STORAGE_KEY),
  )
  const existingCookieId = getGuestVisitorIdCookie()
  const existingVisitorId = existingStorageId ?? existingCookieId

  if (existingVisitorId) {
    window.localStorage.setItem(GUEST_VISITOR_ID_STORAGE_KEY, existingVisitorId)
    setGuestVisitorIdCookie(existingVisitorId)
    return existingVisitorId
  }

  const nextVisitorId = createGuestVisitorId()
  window.localStorage.setItem(GUEST_VISITOR_ID_STORAGE_KEY, nextVisitorId)
  setGuestVisitorIdCookie(nextVisitorId)
  return nextVisitorId
}

export function hasGuestTrackingOptOut() {
  if (typeof window === 'undefined') {
    return true
  }

  return (
    window.localStorage.getItem(GUEST_TRACKING_OPT_OUT_STORAGE_KEY) === 'true'
  )
}

export function setGuestTrackingOptOut(optOut: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  if (optOut) {
    window.localStorage.setItem(GUEST_TRACKING_OPT_OUT_STORAGE_KEY, 'true')
    return
  }

  window.localStorage.removeItem(GUEST_TRACKING_OPT_OUT_STORAGE_KEY)
}
