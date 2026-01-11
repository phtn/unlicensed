/**
 * Checkout Configuration
 *
 * Toggle checkout dev mode behavior:
 * - true: Shows development modal after order placement (skips payment)
 * - false: Redirects to payment page to proceed with payment processing (production mode)
 *
 * To toggle: Change DEFAULT_CHECKOUT_DEV_MODE below, or set NEXT_PUBLIC_CHECKOUT_DEV_MODE env var
 */

// Change this to false to enable production mode (payment processing)
const DEFAULT_CHECKOUT_DEV_MODE = false

/**
 * Check if checkout is in dev mode
 * Checks NEXT_PUBLIC_CHECKOUT_DEV_MODE env var first, then falls back to default
 */
export const isCheckoutDevMode = (): boolean => {
  const envValue = process.env.NEXT_PUBLIC_CHECKOUT_DEV_MODE
  if (envValue !== undefined) {
    return envValue === 'true'
  }
  return DEFAULT_CHECKOUT_DEV_MODE
}
