/**
 * Pure rewards-related computations. Extracted for testability.
 */

import type {RewardsConfig} from '../checkout/lib/rewards'
import {computeRewards, REWARDS_CONFIG} from '../checkout/lib/rewards'
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
 * Uses admin-configured RewardsConfig when provided, otherwise REWARDS_CONFIG.
 */
export function computeCartRewards(
  cartItems: CartPageItem[],
  subtotalCents: number,
  isFirstOrder: boolean,
  config?: RewardsConfig | null,
) {
  const rewardsItems = mapCartItemsToRewardsItems(cartItems)
  const subtotalDollars = subtotalCents / 100
  return computeRewards(
    rewardsItems,
    subtotalDollars,
    isFirstOrder,
    config ?? REWARDS_CONFIG,
  )
}
