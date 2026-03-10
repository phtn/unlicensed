import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {couponDiscountTypeValidator} from './d'

const couponInputFields = {
  code: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  enabled: v.boolean(),
  discountType: couponDiscountTypeValidator,
  discountValue: v.number(),
  minimumSubtotalCents: v.optional(v.number()),
  maximumDiscountCents: v.optional(v.number()),
  startsAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  usageLimit: v.optional(v.number()),
  perUserLimit: v.optional(v.number()),
  stackable: v.optional(v.boolean()),
  notes: v.optional(v.string()),
}

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase()
}

function normalizeText(value: string | undefined) {
  const next = value?.trim()
  return next ? next : undefined
}

function validateCoupon(args: {
  code: string
  name: string
  description?: string
  enabled: boolean
  discountType: 'percentage' | 'fixed_amount'
  discountValue: number
  minimumSubtotalCents?: number
  maximumDiscountCents?: number
  startsAt?: number
  expiresAt?: number
  usageLimit?: number
  perUserLimit?: number
  stackable?: boolean
  notes?: string
}) {
  const code = normalizeCouponCode(args.code)
  const name = args.name.trim()

  if (!code) throw new Error('Coupon code is required')
  if (!name) throw new Error('Coupon name is required')
  if (args.discountType === 'percentage') {
    if (args.discountValue <= 0 || args.discountValue > 100) {
      throw new Error('Percentage discounts must be greater than 0 and at most 100')
    }
  } else if (args.discountValue <= 0) {
    throw new Error('Fixed discounts must be greater than $0')
  }

  if (
    args.minimumSubtotalCents !== undefined &&
    args.minimumSubtotalCents < 0
  ) {
    throw new Error('Minimum subtotal cannot be negative')
  }

  if (
    args.maximumDiscountCents !== undefined &&
    args.maximumDiscountCents <= 0
  ) {
    throw new Error('Maximum discount must be greater than $0')
  }

  if (args.usageLimit !== undefined && args.usageLimit < 1) {
    throw new Error('Usage limit must be at least 1')
  }

  if (args.perUserLimit !== undefined && args.perUserLimit < 1) {
    throw new Error('Per-user limit must be at least 1')
  }

  if (
    args.startsAt !== undefined &&
    args.expiresAt !== undefined &&
    args.expiresAt <= args.startsAt
  ) {
    throw new Error('Expiry must be later than the start date')
  }

  return {
    code,
    name,
    description: normalizeText(args.description),
    enabled: args.enabled,
    discountType: args.discountType,
    discountValue: args.discountValue,
    minimumSubtotalCents: args.minimumSubtotalCents,
    maximumDiscountCents: args.maximumDiscountCents,
    startsAt: args.startsAt,
    expiresAt: args.expiresAt,
    usageLimit: args.usageLimit,
    perUserLimit: args.perUserLimit,
    stackable: args.stackable ?? false,
    notes: normalizeText(args.notes),
  }
}

export const createCoupon = mutation({
  args: {
    coupon: v.object(couponInputFields),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, {coupon, updatedBy}) => {
    const next = validateCoupon(coupon)
    const existing = await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', next.code))
      .unique()

    if (existing) throw new Error(`Coupon code "${next.code}" already exists`)

    const now = Date.now()
    return await ctx.db.insert('coupons', {
      ...next,
      timesRedeemed: 0,
      createdAt: now,
      updatedAt: now,
      updatedBy,
    })
  },
})

export const updateCoupon = mutation({
  args: {
    id: v.id('coupons'),
    coupon: v.object(couponInputFields),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, {id, coupon, updatedBy}) => {
    const next = validateCoupon(coupon)
    const existing = await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', next.code))
      .unique()

    if (existing && existing._id !== id) {
      throw new Error(`Coupon code "${next.code}" already exists`)
    }

    await ctx.db.patch(id, {
      ...next,
      updatedAt: Date.now(),
      updatedBy,
    })
  },
})

export const setCouponEnabled = mutation({
  args: {
    id: v.id('coupons'),
    enabled: v.boolean(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, {id, enabled, updatedBy}) => {
    await ctx.db.patch(id, {
      enabled,
      updatedAt: Date.now(),
      updatedBy,
    })
  },
})

export const deleteCoupon = mutation({
  args: {
    id: v.id('coupons'),
  },
  handler: async (ctx, {id}) => {
    await ctx.db.delete(id)
  },
})
