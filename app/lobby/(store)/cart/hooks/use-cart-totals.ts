'use client'

import {useMemo} from 'react'
import {
  computeEstimatedPoints,
  computeOrderTotals,
  computeCartRewards,
  mapCartItemsToRewardsItems,
} from '../lib'
import type {CartPageItem} from '../types'

interface TaxConfig {
  active?: boolean
  taxRatePercent?: number
}

interface ShippingConfig {
  shippingFeeCents: number
  minimumOrderCents: number
}

interface NextVisitMultiplierLike {
  multiplier: number
}

interface UseCartTotalsParams {
  cartItems: CartPageItem[]
  taxConfig: TaxConfig | null | undefined
  shippingConfig: ShippingConfig | null | undefined
}

interface UseCartTotalsResult {
  subtotal: number
  tax: number
  shipping: number
  total: number
}

/**
 * Hook that computes order totals from cart items and config.
 * Uses pure functions internally for testability.
 */
export function useCartTotals({
  cartItems,
  taxConfig,
  shippingConfig,
}: UseCartTotalsParams): UseCartTotalsResult {
  return useMemo(
    () =>
      computeOrderTotals(
        cartItems,
        taxConfig ?? null,
        shippingConfig ?? null,
      ),
    [cartItems, taxConfig, shippingConfig],
  )
}

interface UseCartRewardsParams {
  cartItems: CartPageItem[]
  subtotal: number
  isFirstOrder?: boolean
}

/**
 * Hook that computes rewards (tier, cashback, etc.) from cart items.
 */
export function useCartRewards({
  cartItems,
  subtotal,
  isFirstOrder = false,
}: UseCartRewardsParams) {
  return useMemo(
    () => computeCartRewards(cartItems, subtotal, isFirstOrder),
    [cartItems, subtotal, isFirstOrder],
  )
}

/**
 * Maps cart items to rewards input format. Exposed for components that only need the mapping.
 */
export function useRewardsItems(cartItems: CartPageItem[]) {
  return useMemo(() => mapCartItemsToRewardsItems(cartItems), [cartItems])
}

interface UseEstimatedPointsParams {
  subtotal: number
  nextVisitMultiplier: NextVisitMultiplierLike | null | undefined
  isAuthenticated: boolean
}

/**
 * Hook that computes estimated points earned on this order.
 */
export function useEstimatedPoints({
  subtotal,
  nextVisitMultiplier,
  isAuthenticated,
}: UseEstimatedPointsParams): number | null {
  return useMemo(
    () =>
      computeEstimatedPoints(subtotal, nextVisitMultiplier, isAuthenticated),
    [subtotal, nextVisitMultiplier, isAuthenticated],
  )
}
