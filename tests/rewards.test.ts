import {
  computeCashBackAmount,
  computeRewards,
  formatRewardsCurrency,
  REWARDS_CONFIG,
} from '@/app/lobby/(store)/cart/checkout/lib/rewards'
import {describe, expect, test} from 'bun:test'

describe('computeCashBackAmount', () => {
  test('calculates cash back from eligible subtotal', () => {
    expect(computeCashBackAmount(90, 5)).toBe(4.5)
  })

  test('clamps negative subtotals to zero', () => {
    expect(computeCashBackAmount(-10, 5)).toBe(0)
  })
})

describe('computeRewards', () => {
  test('uses Bronze tier defaults for low subtotal repeat orders', () => {
    const result = computeRewards([{category: 'flower'}], 50, false)

    expect(result.currentTier.label).toBe('Bronze')
    expect(result.cashBackPct).toBe(1.5)
    expect(result.shippingCost).toBe(12.99)
    expect(result.nextTier?.label).toBe('Silver')
    expect(result.amountToNextTier).toBe(49)
  })

  test('waives shipping for first orders at or above the first-order threshold', () => {
    const result = computeRewards([{category: 'flower'}], 50, true)

    expect(result.currentTier.label).toBe('Bronze')
    expect(result.shippingCost).toBe(0)
    expect(result.isFirstOrder).toBe(true)
  })

  test('activates bundle bonus when enough unique categories are present', () => {
    const result = computeRewards(
      [{category: 'flower'}, {category: 'edibles'}],
      100,
      false,
    )

    expect(result.currentTier.label).toBe('Silver')
    expect(result.uniqueCategories).toBe(2)
    expect(result.isBundleBonusActive).toBe(true)
    expect(result.cashBackPct).toBe(2.5)
    expect(result.cashBackAmount).toBe(2.5)
  })

  test('caps progress and removes next tier details at Platinum', () => {
    const result = computeRewards([{category: 'flower'}], 300, false)

    expect(result.currentTier.label).toBe('Platinum')
    expect(result.nextTier).toBeNull()
    expect(result.futureTiers).toEqual([])
    expect(result.amountToNextTier).toBeNull()
    expect(result.progressPctToNext).toBe(100)
    expect(result.isNearThreshold).toBe(false)
  })

  test('supports custom rewards config overrides', () => {
    const customConfig = {
      ...REWARDS_CONFIG,
      bundleBonus: {
        enabled: false,
        bonusPct: 9,
        minCategories: 2,
      },
    }

    const result = computeRewards(
      [{category: 'flower'}, {category: 'edibles'}],
      100,
      false,
      customConfig,
    )

    expect(result.isBundleBonusActive).toBe(false)
    expect(result.cashBackPct).toBe(2)
  })
})

describe('formatRewardsCurrency', () => {
  test('formats dollars as USD currency', () => {
    expect(formatRewardsCurrency(12.99)).toBe('$12.99')
  })
})
