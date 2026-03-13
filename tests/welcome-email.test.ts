import {describe, expect, test} from 'bun:test'
import type {Doc} from '../convex/_generated/dataModel'
import {pickWelcomeCoupon} from '../lib/resend/send-welcome-email'

const NOW = new Date('2026-03-13T00:00:00.000Z').getTime()

const makeCoupon = (
  overrides: Partial<Doc<'coupons'>> = {},
): Doc<'coupons'> => ({
  _id: 'ns1234567890abcdefghijklmnopqrstuv' as Doc<'coupons'>['_id'],
  _creationTime: NOW,
  code: 'GENERIC10',
  name: 'Generic promo',
  enabled: true,
  discountType: 'percentage',
  discountValue: 10,
  timesRedeemed: 0,
  createdAt: NOW - 10_000,
  updatedAt: NOW - 10_000,
  ...overrides,
})

describe('pickWelcomeCoupon', () => {
  test('prefers active first-order or welcome coupons over generic active coupons', () => {
    const selected = pickWelcomeCoupon(
      [
        makeCoupon({
          code: 'SPRING15',
          name: 'Spring sale',
          updatedAt: NOW + 100,
        }),
        makeCoupon({
          _id: 'nsabcdefghijklmnopqrstuv1234567890' as Doc<'coupons'>['_id'],
          code: 'FIRE25',
          name: 'FIRE25',
          description: 'FIRE25 First Order',
          discountType: 'fixed_amount',
          discountValue: 2500,
          updatedAt: NOW,
        }),
      ],
      NOW,
    )

    expect(selected?.code).toBe('FIRE25')
  })

  test('returns the only active coupon when there is no explicit welcome match', () => {
    const selected = pickWelcomeCoupon(
      [
        makeCoupon({
          code: 'ONLYONE',
          name: 'Single active promo',
        }),
        makeCoupon({
          _id: 'nsinactivecouponabcdefghijklmnop' as Doc<'coupons'>['_id'],
          code: 'LATER20',
          enabled: false,
        }),
      ],
      NOW,
    )

    expect(selected?.code).toBe('ONLYONE')
  })

  test('returns null when multiple active coupons exist but none look like a welcome coupon', () => {
    const selected = pickWelcomeCoupon(
      [
        makeCoupon({
          code: 'SPRING15',
          name: 'Spring sale',
        }),
        makeCoupon({
          _id: 'nsblackfridaycouponabcdefghijkl' as Doc<'coupons'>['_id'],
          code: 'VIP20',
          name: 'VIP sale',
          updatedAt: NOW + 1_000,
        }),
      ],
      NOW,
    )

    expect(selected).toBeNull()
  })

  test('ignores disabled, scheduled, and expired coupons', () => {
    const selected = pickWelcomeCoupon(
      [
        makeCoupon({
          code: 'DISABLED25',
          description: 'First order',
          enabled: false,
        }),
        makeCoupon({
          _id: 'nsscheduledcouponabcdefghijklmn' as Doc<'coupons'>['_id'],
          code: 'SOON25',
          description: 'Welcome coupon',
          startsAt: NOW + 60_000,
        }),
        makeCoupon({
          _id: 'nsexpiredcouponabcdefghijklmnop' as Doc<'coupons'>['_id'],
          code: 'OLD25',
          description: 'Welcome coupon',
          expiresAt: NOW - 1,
        }),
        makeCoupon({
          _id: 'nsvalidwelcomecouponabcdefghij' as Doc<'coupons'>['_id'],
          code: 'FIRE25',
          description: 'First order coupon',
          discountType: 'fixed_amount',
          discountValue: 2500,
        }),
      ],
      NOW,
    )

    expect(selected?.code).toBe('FIRE25')
  })
})
