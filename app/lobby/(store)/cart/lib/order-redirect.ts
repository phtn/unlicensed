/**
 * Pure order redirect path computation. Extracted for testability.
 */

import type {Id} from '@/convex/_generated/dataModel'

/**
 * Returns the redirect path for an order based on payment method.
 * Handles cards, cash_app, crypto_transfer, crypto_commerce, crypto-payment.
 */
export function getOrderRedirectPath(
  orderId: Id<'orders'>,
  paymentMethod: string,
): string {
  const method = String(paymentMethod)
  const isCrypto =
    method === 'crypto_commerce' || method === 'crypto-payment'

  if (method === 'cards') return `/lobby/order/${orderId}/cards`
  if (method === 'cash_app') return `/lobby/order/${orderId}/cashapp`
  if (method === 'crypto_transfer') return `/lobby/order/${orderId}/send`
  if (isCrypto) return `/lobby/order/${orderId}/crypto`

  return `/lobby/order/${orderId}/send`
}
