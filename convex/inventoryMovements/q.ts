import {v} from 'convex/values'
import {query} from '../_generated/server'

export const getProductInventoryMovements = query({
  args: {
    productId: v.id('products'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 12

    return await ctx.db
      .query('inventoryMovements')
      .withIndex('by_product_created_at', (q) => q.eq('productId', args.productId))
      .order('desc')
      .take(limit)
  },
})
