/**
 * Pure rewards-related computations. Extracted for testability.
 */

import {computeRewards} from '../checkout/lib/rewards'
import type {CartPageItem} from '../types'

export interface RewardsItemInput {
  category: string
}

/**
 * Maps cart items to rewards input (category only).
 * computeRewards only needs category for uniqueCategories and bundle bonus.
 */
export function mapCartItemsToRewardsItems(
  cartItems: CartPageItem[],
): RewardsItemInput[] {
  return cartItems.map((item) => ({
    category: item.product.categorySlug ?? 'Uncategorized',
  }))
}

export interface NextVisitMultiplierLike {
  multiplier: number
}

/**
 * Computes estimated points earned on this order.
 * Returns null when not authenticated or multiplier unavailable.
 */
export function computeEstimatedPoints(
  subtotalCents: number,
  nextVisitMultiplier: NextVisitMultiplierLike | null | undefined,
  isAuthenticated: boolean,
): number | null {
  if (!nextVisitMultiplier || !isAuthenticated) return null
  const subtotalDollars = subtotalCents / 100
  return Math.round(subtotalDollars * nextVisitMultiplier.multiplier)
}

/**
 * Computes rewards (tier, cashback, shipping) from cart items and subtotal.
 */
export function computeCartRewards(
  cartItems: CartPageItem[],
  subtotalCents: number,
  isFirstOrder: boolean,
) {
  const rewardsItems = mapCartItemsToRewardsItems(cartItems)
  const subtotalDollars = subtotalCents / 100
  return computeRewards(rewardsItems, subtotalDollars, isFirstOrder)
}
