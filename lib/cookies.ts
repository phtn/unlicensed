/**
 * Cookie utilities for managing cart ID in secure cookies
 */

const CART_COOKIE_NAME = 'hyfe_cart_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

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
}

/**
 * Get cart ID from cookie
 */
export function getCartCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CART_COOKIE_NAME) {
      return value || null
    }
  }
  return null
}

/**
 * Delete cart ID cookie
 */
export function deleteCartCookie() {
  if (typeof document === 'undefined') return

  document.cookie = `${CART_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
}

