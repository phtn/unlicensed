import {Infer, v} from 'convex/values'

export const productHoldSchema = v.object({
  cartId: v.id('carts'),
  productId: v.id('products'),
  /** Denomination value (e.g. 0.125, 1, 3.5). Omitted for legacy single-stock products. */
  denomination: v.optional(v.number()),
  quantity: v.number(),
  /** Timestamp (ms) when this hold expires; after this the hold is released by cron. */
  expiresAt: v.number(),
})

export type ProductHoldType = Infer<typeof productHoldSchema>
