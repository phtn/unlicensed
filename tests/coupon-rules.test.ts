import {describe, expect, test} from 'bun:test'
import type {Doc} from '../convex/_generated/dataModel'
import {
  getCouponDiscountCents,
  getCouponEligibilityError,
  isCouponActive,
  normalizeCouponCode,
} from '../convex/coupons/lib'

const NOW = new Date('2026-03-14T00:00:00.000Z').getTime()

const makeCoupon = (
  overrides: Partial<Doc<'coupons'>> = {},
): Doc<'coupons'> => ({
  _id: 'ns1234567890abcdefghijklmnopqrstuv' as Doc<'coupons'>['_id'],
  _creationTime: NOW,
  code: 'SAVE10',
  name: 'Save 10%',
  enabled: true,
  discountType: 'percentage',
  discountValue: 10,
  timesRedeemed: 0,
  createdAt: NOW - 10_000,
  updatedAt: NOW - 10_000,
  ...overrides,
})

describe('normalizeCouponCode', () => {
  test('trims whitespace and uppercases the code', () => {
    expect(normalizeCouponCode('  save10  ')).toBe('SAVE10')
  })
})

describe('isCouponActive', () => {
  test('returns false for disabled, scheduled, or expired coupons', () => {
    expect(isCouponActive(makeCoupon({enabled: false}), NOW)).toBe(false)
    expect(isCouponActive(makeCoupon({startsAt: NOW + 1}), NOW)).toBe(false)
    expect(isCouponActive(makeCoupon({expiresAt: NOW}), NOW)).toBe(false)
  })

  test('returns true for an enabled coupon within its active window', () => {
    expect(
      isCouponActive(
        makeCoupon({
          startsAt: NOW - 1,
          expiresAt: NOW + 60_000,
        }),
        NOW,
      ),
    ).toBe(true)
  })
})

describe('getCouponDiscountCents', () => {
  test('applies percentage discounts to subtotal only', () => {
    expect(getCouponDiscountCents(makeCoupon({discountValue: 25}), 8000)).toBe(
      2000,
    )
  })

  test('caps fixed discounts at the subtotal', () => {
    expect(
      getCouponDiscountCents(
        makeCoupon({
          discountType: 'fixed_amount',
          discountValue: 5000,
        }),
        2400,
      ),
    ).toBe(2400)
  })

  test('respects maximumDiscountCents when present', () => {
    expect(
      getCouponDiscountCents(
        makeCoupon({
          discountValue: 50,
          maximumDiscountCents: 1500,
        }),
        5000,
      ),
    ).toBe(1500)
  })
})

describe('getCouponEligibilityError', () => {
  test('defaults to one use per user when no per-user limit is configured', () => {
    expect(
      getCouponEligibilityError(makeCoupon(), {
        subtotalCents: 5000,
        userUses: 1,
        now: NOW,
      }),
    ).toBe('You have already used this coupon.')
  })

  test('allows reuse until the explicit per-user limit is reached', () => {
    expect(
      getCouponEligibilityError(makeCoupon({perUserLimit: 2}), {
        subtotalCents: 5000,
        userUses: 1,
        now: NOW,
      }),
    ).toBeNull()
  })

  test('rejects orders below the minimum subtotal', () => {
    expect(
      getCouponEligibilityError(
        makeCoupon({
          minimumSubtotalCents: 7500,
        }),
        {
          subtotalCents: 5000,
          userUses: 0,
          now: NOW,
        },
      ),
    ).toBe('This coupon requires a subtotal of at least $75.00.')
  })

  test('rejects coupons that have hit their total usage limit', () => {
    expect(
      getCouponEligibilityError(
        makeCoupon({
          usageLimit: 10,
          timesRedeemed: 10,
        }),
        {
          subtotalCents: 5000,
          userUses: 0,
          now: NOW,
        },
      ),
    ).toBe('This coupon has reached its usage limit.')
  })
})
