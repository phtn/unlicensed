/**
 * Checkout Configuration
 *
 * Dev mode: Set NEXT_PUBLIC_CHECKOUT_DEV_MODE=true to skip payment and show dev modal.
 * Production mode (default): Omit the env var or set it to false to redirect to payment processing.
 */

/**
 * Check if checkout is in dev mode (skips payment, shows dev modal).
 * Only returns true when NEXT_PUBLIC_CHECKOUT_DEV_MODE is explicitly "true" or "1".
 * All other values (including "false", undefined, empty) enable production mode (payment processing).
 */
export const isCheckoutDevMode = (): boolean => {
  const envValue = process.env.NEXT_PUBLIC_CHECKOUT_DEV_MODE?.toLowerCase()
  return envValue === 'true' || envValue === '1'
}
