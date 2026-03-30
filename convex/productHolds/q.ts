import {v} from 'convex/values'
import {
  getAvailableCartQuantityForDenomination,
  getSharedInventoryLineQuantity,
  getStockForDenomination,
  normalizeInventoryMode,
  roundStockQuantity,
} from '../../lib/productStock'
import {query} from '../_generated/server'

const getHeldQuantity = (
  product: {
    inventoryMode?: string
    masterStockQuantity?: number
    masterStockUnit?: string
    unit?: string
  },
  holds: Array<{denomination?: number; quantity: number; expiresAt: number}>,
  now: number,
) =>
  roundStockQuantity(
    holds
      .filter((hold) => hold.expiresAt > now)
      .reduce(
        (sum, hold) =>
          sum +
          (getSharedInventoryLineQuantity(
            product,
            hold.denomination,
            hold.quantity,
          ) ?? hold.quantity),
        0,
      ),
  )

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
    const stock = getStockForDenomination(product, args.denomination)
    const holds =
      normalizeInventoryMode(product.inventoryMode) === 'shared'
        ? await ctx.db
            .query('productHolds')
            .withIndex('by_product', (q) => q.eq('productId', args.productId))
            .collect()
        : await ctx.db
            .query('productHolds')
            .withIndex('by_product_denom', (q) =>
              q
                .eq('productId', args.productId)
                .eq('denomination', args.denomination),
            )
            .collect()
    const held = getHeldQuantity(product, holds, now)
    const remainingStock = Math.max(0, roundStockQuantity(stock - held))

    return getAvailableCartQuantityForDenomination(
      product,
      args.denomination,
      remainingStock,
    )
  },
})

const productDenomPair = v.object({
  productId: v.id('products'),
  denomination: v.optional(v.number()),
})

/**
 * Returns available quantities for multiple product/denomination pairs.
 * Use for deal builders with many products.
 */
export const getAvailableQuantities = query({
  args: {
    pairs: v.array(productDenomPair),
  },
  handler: async (ctx, args) => {
    const result: Record<string, number> = {}
    const now = Date.now()

    for (const {productId, denomination} of args.pairs) {
      const product = await ctx.db.get(productId)
      if (!product) {
        result[`${productId}-${denomination ?? 'default'}`] = 0
        continue
      }

      const stock = getStockForDenomination(product, denomination)
      const holds =
        normalizeInventoryMode(product.inventoryMode) === 'shared'
          ? await ctx.db
              .query('productHolds')
              .withIndex('by_product', (q) => q.eq('productId', productId))
              .collect()
          : await ctx.db
              .query('productHolds')
              .withIndex('by_product_denom', (q) =>
                q.eq('productId', productId).eq('denomination', denomination),
              )
              .collect()
      const held = getHeldQuantity(product, holds, now)
      const remainingStock = Math.max(0, roundStockQuantity(stock - held))

      result[`${productId}-${denomination ?? 'default'}`] =
        getAvailableCartQuantityForDenomination(
          product,
          denomination,
          remainingStock,
        )
    }

    return result
  },
})
