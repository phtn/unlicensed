import {v} from 'convex/values'
import {query} from '../_generated/server'
import {
  getCouponDiscountCents,
  getCouponEligibilityError,
  normalizeCouponCode,
} from './lib'

export const listCoupons = query({
  handler: async (ctx) => {
    const coupons = await ctx.db.query('coupons').collect()
    return coupons.slice().sort((a, b) => b.updatedAt - a.updatedAt)
  },
})

export const getCouponByCode = query({
  args: {code: v.string()},
  handler: async (ctx, {code}) => {
    return await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', normalizeCouponCode(code)))
      .unique()
  },
})

export const validateCouponForCheckout = query({
  args: {
    code: v.string(),
    userId: v.id('users'),
    subtotalCents: v.number(),
  },
  handler: async (ctx, args) => {
    const normalizedCode = normalizeCouponCode(args.code)
    if (!normalizedCode) {
      return {
        ok: false as const,
        code: '',
        discountCents: 0,
        error: 'Enter a coupon code.',
      }
    }

    const coupon = await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', normalizedCode))
      .unique()

    if (!coupon) {
      return {
        ok: false as const,
        code: normalizedCode,
        discountCents: 0,
        error: 'Coupon code not found.',
      }
    }

    const userOrders = await ctx.db
      .query('orders')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    const userUses = userOrders.filter(
      (order) => order.couponId === coupon._id && order.orderStatus !== 'cancelled',
    ).length

    const error = getCouponEligibilityError(coupon, {
      subtotalCents: args.subtotalCents,
      userUses,
    })

    if (error) {
      return {
        ok: false as const,
        code: coupon.code,
        discountCents: 0,
        error,
      }
    }

    const discountCents = getCouponDiscountCents(coupon, args.subtotalCents)

    return {
      ok: true as const,
      couponId: coupon._id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? null,
      discountCents,
    }
  },
})
