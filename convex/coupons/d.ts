import {Infer, v} from 'convex/values'

export const couponDiscountTypeValidator = v.union(
  v.literal('percentage'),
  v.literal('fixed_amount'),
)

export const couponSchema = v.object({
  code: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  enabled: v.boolean(),
  discountType: couponDiscountTypeValidator,
  /** Percentage points when `discountType` is `percentage`, otherwise cents. */
  discountValue: v.number(),
  minimumSubtotalCents: v.optional(v.number()),
  maximumDiscountCents: v.optional(v.number()),
  startsAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  usageLimit: v.optional(v.number()),
  perUserLimit: v.optional(v.number()),
  stackable: v.optional(v.boolean()),
  notes: v.optional(v.string()),
  timesRedeemed: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  updatedBy: v.optional(v.string()),
})

export type Coupon = Infer<typeof couponSchema>
export type CouponDiscountType = Infer<typeof couponDiscountTypeValidator>
