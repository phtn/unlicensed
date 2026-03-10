import {describe, expect, test} from 'bun:test'
import {
  computeSubtotal,
  computeTax,
  computeShipping,
  computeOrderTotals,
} from '../app/lobby/(store)/cart/lib/totals'
import {getOrderRedirectPath} from '../app/lobby/(store)/cart/lib/order-redirect'
import {
  mapCartItemsToRewardsItems,
  computeEstimatedPoints,
  computeCartRewards,
} from '../app/lobby/(store)/cart/lib/rewards-mappings'
import type {CartPageItem} from '../app/lobby/(store)/cart/types'
import type {Id} from '../convex/_generated/dataModel'

// ─── Test Fixtures ─────────────────────────────────────────────────────────────

function createCartItem(overrides: Partial<CartPageItem> = {}): CartPageItem {
  return {
    product: {
      _id: 'prod_test' as Id<'products'>,
      priceCents: 1000,
      categorySlug: 'flower',
      name: 'Test Product',
      slug: 'test-product',
      ...overrides.product,
    } as CartPageItem['product'],
    quantity: 1,
    denomination: 1,
    ...overrides,
  }
}

/** priceByDenomination values are stored in cents (per Convex schema). */
function createCartItemWithPriceByDenom(
  denomination: number,
  priceCents: number,
): CartPageItem {
  return createCartItem({
    product: {
      _id: 'prod_test' as Id<'products'>,
      priceByDenomination: {[String(denomination)]: priceCents},
      categorySlug: 'flower',
      name: 'Test',
      slug: 'test',
    } as CartPageItem['product'],
    quantity: 1,
    denomination,
  })
}

// ─── Totals Tests ──────────────────────────────────────────────────────────────

describe('computeSubtotal', () => {
  test('returns 0 for empty cart', () => {
    expect(computeSubtotal([])).toBe(0)
  })

  test('computes single item: priceCents * quantity', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, priceCents: 1000}, quantity: 2}),
    ]
    expect(computeSubtotal(items)).toBe(2000)
  })

  test('sums multiple items', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, priceCents: 500}, quantity: 2}),
      createCartItem({product: {...createCartItem().product, priceCents: 1000}, quantity: 1}),
    ]
    expect(computeSubtotal(items)).toBe(2000) // 500*2 + 1000*1
  })

  test('uses denomination when no priceByDenomination', () => {
    const items: CartPageItem[] = [
      createCartItem({
        product: {...createCartItem().product, priceCents: 100},
        quantity: 1,
        denomination: 3,
      }),
    ]
    expect(computeSubtotal(items)).toBe(300) // 100 * 3
  })

  test('uses priceByDenomination when available', () => {
    const items = [
      createCartItemWithPriceByDenom(3.5, 2599), // 2599 cents per unit, qty 1
    ]
    expect(computeSubtotal(items)).toBe(2599)
  })

  test('accepts custom getUnitPrice for testability', () => {
    const items = [createCartItem({quantity: 2})]
    const mockGetPrice = () => 100
    expect(computeSubtotal(items, mockGetPrice)).toBe(200)
  })
})

describe('computeTax', () => {
  test('returns 0 when tax config is null', () => {
    expect(computeTax(10000, null)).toBe(0)
  })

  test('returns 0 when tax is inactive', () => {
    expect(computeTax(10000, {active: false, taxRatePercent: 10})).toBe(0)
  })

  test('computes tax when active', () => {
    expect(computeTax(10000, {active: true, taxRatePercent: 10})).toBe(1000)
  })

  test('rounds tax to nearest cent', () => {
    expect(computeTax(9999, {active: true, taxRatePercent: 10})).toBe(1000)
  })

  test('handles missing taxRatePercent as 0', () => {
    expect(computeTax(10000, {active: true})).toBe(0)
  })
})

describe('computeShipping', () => {
  test('returns 0 when subtotal >= minimum (free shipping)', () => {
    expect(computeShipping(5000, 5000, 500)).toBe(0)
  })

  test('returns 0 when subtotal > minimum', () => {
    expect(computeShipping(6000, 5000, 500)).toBe(0)
  })

  test('returns shipping fee when subtotal < minimum', () => {
    expect(computeShipping(4999, 5000, 500)).toBe(500)
  })

  test('returns shipping fee for zero subtotal', () => {
    expect(computeShipping(0, 5000, 500)).toBe(500)
  })
})

describe('computeOrderTotals', () => {
  test('computes all totals correctly', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, priceCents: 6000}, quantity: 1}),
    ]
    const taxConfig = {active: true, taxRatePercent: 10}
    const shippingConfig = {minimumOrderCents: 5000, shippingFeeCents: 500}

    const result = computeOrderTotals(items, taxConfig, shippingConfig)

    expect(result.subtotal).toBe(6000)
    expect(result.tax).toBe(600) // 10% of 6000
    expect(result.shipping).toBe(0) // free over 5000
    expect(result.total).toBe(6600)
  })

  test('applies shipping when below minimum', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, priceCents: 1000}, quantity: 1}),
    ]
    const taxConfig = {active: false}
    const shippingConfig = {minimumOrderCents: 5000, shippingFeeCents: 500}

    const result = computeOrderTotals(items, taxConfig, shippingConfig)

    expect(result.subtotal).toBe(1000)
    expect(result.tax).toBe(0)
    expect(result.shipping).toBe(500)
    expect(result.total).toBe(1500)
  })

  test('uses defaults when shippingConfig is null', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, priceCents: 1000}, quantity: 1}),
    ]
    const result = computeOrderTotals(items, null, null)
    // Default min 9900, fee 1299
    expect(result.shipping).toBe(1299)
    expect(result.total).toBe(2299)
  })
})

// ─── Order Redirect Tests ──────────────────────────────────────────────────────

describe('getOrderRedirectPath', () => {
  const orderId = 'ord_test123' as Id<'orders'>

  test('cards -> /lobby/order/:id/cards', () => {
    expect(getOrderRedirectPath(orderId, 'cards')).toBe(
      '/lobby/order/ord_test123/cards',
    )
  })

  test('cash_app -> /lobby/order/:id/cashapp', () => {
    expect(getOrderRedirectPath(orderId, 'cash_app')).toBe(
      '/lobby/order/ord_test123/cashapp',
    )
  })

  test('crypto_transfer -> /lobby/order/:id/send', () => {
    expect(getOrderRedirectPath(orderId, 'crypto_transfer')).toBe(
      '/lobby/order/ord_test123/send',
    )
  })

  test('crypto_commerce -> /lobby/order/:id/crypto', () => {
    expect(getOrderRedirectPath(orderId, 'crypto_commerce')).toBe(
      '/lobby/order/ord_test123/crypto',
    )
  })

  test('crypto-payment -> /lobby/order/:id/crypto', () => {
    expect(getOrderRedirectPath(orderId, 'crypto-payment')).toBe(
      '/lobby/order/ord_test123/crypto',
    )
  })

  test('unknown method defaults to /send', () => {
    expect(getOrderRedirectPath(orderId, 'other')).toBe(
      '/lobby/order/ord_test123/send',
    )
  })

  test('coerces paymentMethod to string', () => {
    expect(
      getOrderRedirectPath(orderId, 123 as unknown as string),
    ).toBe('/lobby/order/ord_test123/send')
  })
})

// ─── Rewards Mappings Tests ────────────────────────────────────────────────────

describe('mapCartItemsToRewardsItems', () => {
  test('maps to category', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, categorySlug: 'flower'}}),
    ]
    const result = mapCartItemsToRewardsItems(items)
    expect(result).toEqual([{category: 'flower'}])
  })

  test('uses Uncategorized when categorySlug is missing', () => {
    const items: CartPageItem[] = [
      createCartItem({
        product: {...createCartItem().product, categorySlug: undefined},
      }),
    ]
    const result = mapCartItemsToRewardsItems(items)
    expect(result).toEqual([{category: 'Uncategorized'}])
  })

  test('maps multiple items', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, categorySlug: 'flower'}}),
      createCartItem({product: {...createCartItem().product, categorySlug: 'edibles'}}),
    ]
    const result = mapCartItemsToRewardsItems(items)
    expect(result).toEqual([{category: 'flower'}, {category: 'edibles'}])
  })
})

describe('computeEstimatedPoints', () => {
  test('returns null when not authenticated', () => {
    expect(
      computeEstimatedPoints(10000, {multiplier: 2}, false),
    ).toBe(null)
  })

  test('returns null when nextVisitMultiplier is null', () => {
    expect(
      computeEstimatedPoints(10000, null, true),
    ).toBe(null)
  })

  test('returns null when nextVisitMultiplier is undefined', () => {
    expect(
      computeEstimatedPoints(10000, undefined, true),
    ).toBe(null)
  })

  test('computes points: (subtotal/100) * multiplier', () => {
    expect(
      computeEstimatedPoints(10000, {multiplier: 2}, true), // $100 * 2
    ).toBe(200)
  })

  test('rounds to nearest integer', () => {
    expect(
      computeEstimatedPoints(9999, {multiplier: 1.5}, true), // $99.99 * 1.5 = 149.985
    ).toBe(150)
  })
})

describe('computeCartRewards', () => {
  test('returns currentTier based on subtotal', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, categorySlug: 'flower'}}),
    ]
    const subtotalCents = 15000 // $150 -> Gold tier
    const result = computeCartRewards(items, subtotalCents, false)
    expect(result.currentTier.label).toBe('Gold')
    expect(result.cashBackPct).toBe(3.0)
    expect(result.shippingCost).toBe(0)
  })

  test('Starter tier for low subtotal', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, categorySlug: 'flower'}}),
    ]
    const subtotalCents = 5000 // $50
    const result = computeCartRewards(items, subtotalCents, false)
    expect(result.currentTier.label).toBe('Bronze')
    expect(result.cashBackPct).toBe(1.5)
    expect(result.shippingCost).toBe(12.99)
  })

  test('isFirstOrder affects free shipping threshold', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, categorySlug: 'flower'}}),
    ]
    const subtotalCents = 5000 // $50 - first order free ship at $49
    const firstOrder = computeCartRewards(items, subtotalCents, true)
    const repeatOrder = computeCartRewards(items, subtotalCents, false)
    expect(firstOrder.shippingCost).toBe(0)
    expect(repeatOrder.shippingCost).toBe(12.99)
  })

  test('bundle bonus when multiple categories', () => {
    const items: CartPageItem[] = [
      createCartItem({product: {...createCartItem().product, categorySlug: 'flower'}}),
      createCartItem({product: {...createCartItem().product, categorySlug: 'edibles'}}),
    ]
    const subtotalCents = 10000 // $100
    const result = computeCartRewards(items, subtotalCents, false)
    expect(result.isBundleBonusActive).toBe(true)
    expect(result.uniqueCategories).toBe(2)
    expect(result.cashBackPct).toBe(2.0 + 0.5) // Silver + bundle
  })
})
