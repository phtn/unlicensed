/**
 * Cookie utilities for managing cart ID in secure cookies
 */

const CART_COOKIE_NAME = 'hyfe_cart_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

// Cache for cookie parsing (invalidated on visibility change)
let cookieCache: Record<string, string> | null = null

// Invalidate cache when page becomes visible (cookies may have changed in another tab)
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      cookieCache = null
    }
  })
}

/**
 * Set cart ID in a secure cookie
 */
export function setCartCookie(cartId: string) {
  if (typeof document === 'undefined') return

  // Set secure cookie with SameSite=Strict for CSRF protection
  // Secure flag will be set automatically in production (HTTPS)
  const expires = new Date()
  expires.setTime(expires.getTime() + COOKIE_MAX_AGE * 1000)

  document.cookie = `${CART_COOKIE_NAME}=${cartId}; expires=${expires.toUTCString()}; path=/; SameSite=Strict${
    location.protocol === 'https:' ? '; Secure' : ''
  }`

  // Update cache
  if (cookieCache) {
    cookieCache[CART_COOKIE_NAME] = cartId
  }
}

/**
 * Get cart ID from cookie (with caching)
 */
export function getCartCookie(): string | null {
  if (typeof document === 'undefined') return null

  // Use cached cookie map if available
  if (!cookieCache) {
    cookieCache = Object.fromEntries(
      document.cookie.split(';').map((cookie) => {
        const [name, value] = cookie.trim().split('=')
        return [name, value || '']
      }),
    )
  }

  return cookieCache[CART_COOKIE_NAME] || null
}

/**
 * Delete cart ID cookie
 */
export function deleteCartCookie() {
  if (typeof document === 'undefined') return

  document.cookie = `${CART_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`

  // Update cache
  if (cookieCache) {
    delete cookieCache[CART_COOKIE_NAME]
  }
}

