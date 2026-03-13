'use client'

export const GUEST_CHAT_COOKIE_NAME = 'hyfe_guest_chat_id'
const GUEST_CHAT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

const getCookieString = () =>
  typeof document === 'undefined' ? '' : document.cookie

export const createGuestChatId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const getGuestChatIdCookie = () => {
  const cookieEntry = getCookieString()
    .split('; ')
    .find((entry) => entry.startsWith(`${GUEST_CHAT_COOKIE_NAME}=`))

  if (!cookieEntry) {
    return null
  }

  const [, rawValue = ''] = cookieEntry.split('=')

  try {
    return decodeURIComponent(rawValue) || null
  } catch {
    return rawValue || null
  }
}

export const setGuestChatIdCookie = (guestId: string) => {
  if (typeof document === 'undefined') {
    return
  }

  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; secure'
      : ''

  document.cookie = `${GUEST_CHAT_COOKIE_NAME}=${encodeURIComponent(guestId)}; path=/; max-age=${GUEST_CHAT_COOKIE_MAX_AGE}; samesite=lax${secure}`
}

export const clearGuestChatIdCookie = () => {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${GUEST_CHAT_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
}
