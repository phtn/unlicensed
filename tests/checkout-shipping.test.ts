import {describe, expect, test} from 'bun:test'
import {
  resolveOrderShippingCents,
  resolveRewardShippingCostDollars,
} from '../lib/checkout/shipping'

describe('resolveRewardShippingCostDollars', () => {
  test('returns free shipping for qualifying first orders', () => {
    expect(
      resolveRewardShippingCostDollars({
        tierShippingCostDollars: 12.99,
        isFirstOrder: true,
        subtotalDollars: 49,
        freeShippingFirstOrderDollars: 49,
      }),
    ).toBe(0)
  })

  test('preserves the configured tier shipping cost for returning buyers', () => {
    expect(
      resolveRewardShippingCostDollars({
        tierShippingCostDollars: 3.99,
        isFirstOrder: false,
        subtotalDollars: 120,
        freeShippingFirstOrderDollars: 49,
      }),
    ).toBe(3.99)
  })
})

describe('resolveOrderShippingCents', () => {
  test('keeps a free rewards tier free instead of falling back to 1299', () => {
    expect(
      resolveOrderShippingCents({
        subtotalCents: 6000,
        isFirstOrder: false,
        freeShippingFirstOrderDollars: 49,
        rewardTierShippingCostDollars: 0,
        fallbackMinimumOrderCents: 9900,
        fallbackShippingFeeCents: 1299,
      }),
    ).toBe(0)
  })

  test('uses the rewards tier shipping cost when it is non-zero', () => {
    expect(
      resolveOrderShippingCents({
        subtotalCents: 12000,
        isFirstOrder: false,
        freeShippingFirstOrderDollars: 49,
        rewardTierShippingCostDollars: 3.99,
        fallbackMinimumOrderCents: 9900,
        fallbackShippingFeeCents: 1299,
      }),
    ).toBe(399)
  })

  test('falls back to legacy shipping rules when no rewards tier shipping is available', () => {
    expect(
      resolveOrderShippingCents({
        subtotalCents: 4000,
        isFirstOrder: false,
        freeShippingFirstOrderDollars: 49,
        rewardTierShippingCostDollars: undefined,
        fallbackMinimumOrderCents: 5000,
        fallbackShippingFeeCents: 500,
      }),
    ).toBe(500)
  })
})
