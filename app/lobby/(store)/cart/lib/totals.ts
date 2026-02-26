/**
 * Pure cart total computations. Extracted for testability and reuse.
 * All monetary values in cents.
 */

import {getUnitPriceCents} from '@/utils/cartPrice'
import type {CartPageItem} from '../types'

export interface TaxConfig {
  active?: boolean
  taxRatePercent?: number
}

export interface ShippingConfig {
  shippingFeeCents: number
  minimumOrderCents: number
}

export interface OrderTotals {
  subtotal: number
  tax: number
  shipping: number
  total: number
}

/**
 * Computes subtotal in cents from cart items.
 * Injects getUnitPriceCents for testability (default uses real implementation).
 */
export function computeSubtotal(
  items: CartPageItem[],
  getUnitPrice: typeof getUnitPriceCents = getUnitPriceCents,
): number {
  return items.reduce((total, item) => {
    const unitCents = getUnitPrice(item.product, item.denomination)
    return total + unitCents * item.quantity
  }, 0)
}

/**
 * Computes tax in cents based on subtotal and tax config.
 * Returns 0 when tax is inactive.
 */
export function computeTax(
  subtotal: number,
  taxConfig: TaxConfig | null,
): number {
  if (taxConfig?.active !== true) return 0
  const rate = taxConfig.taxRatePercent ?? 0
  return Math.round(subtotal * (rate / 100))
}

/**
 * Computes shipping in cents.
 * Free shipping when subtotal >= minimumOrderCents.
 */
export function computeShipping(
  subtotal: number,
  minimumOrderCents: number,
  shippingFeeCents: number,
): number {
  return subtotal >= minimumOrderCents ? 0 : shippingFeeCents
}

/**
 * Computes all order totals in one pass. Pure function, fully testable.
 */
export function computeOrderTotals(
  cartItems: CartPageItem[],
  taxConfig: TaxConfig | null,
  shippingConfig: ShippingConfig | null,
  getUnitPrice: typeof getUnitPriceCents = getUnitPriceCents,
): OrderTotals {
  const subtotal = computeSubtotal(cartItems, getUnitPrice)
  const tax = computeTax(subtotal, taxConfig)
  const shipping = computeShipping(
    subtotal,
    shippingConfig?.minimumOrderCents ?? 9900,
    shippingConfig?.shippingFeeCents ?? 1299,
  )
  const total = subtotal + tax + shipping
  return {subtotal, tax, shipping, total}
}
