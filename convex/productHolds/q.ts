import {v} from 'convex/values'
import {query} from '../_generated/server'

/**
 * Returns available quantity for a product and denomination (stock minus active holds).
 * Use for UI "X left" and to validate before add-to-cart.
 */
export const getAvailableQuantity = query({
  args: {
    productId: v.id('products'),
    denomination: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) return 0

    const now = Date.now()
    const denomKey =
      args.denomination !== undefined ? String(args.denomination) : null

    let stock: number
    if (product.stockByDenomination != null && denomKey != null) {
      stock = product.stockByDenomination[denomKey] ?? 0
    } else if (product.stockByDenomination != null) {
      stock = Object.values(product.stockByDenomination).reduce(
        (a, b) => a + b,
        0,
      )
    } else {
      stock = product.stock ?? 0
    }

    const holds = await ctx.db
      .query('productHolds')
      .withIndex('by_product_denom', (q) =>
        q.eq('productId', args.productId).eq('denomination', args.denomination),
      )
      .collect()

    const held = holds
      .filter((h) => h.expiresAt > now)
      .reduce((sum, h) => sum + h.quantity, 0)

    return Math.max(0, stock - held)
  },
})
