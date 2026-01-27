import type {Id} from '../_generated/dataModel'
import type {QueryCtx} from '../_generated/server'
import {v} from 'convex/values'
import {query} from '../_generated/server'

/** Fetch product by ID. Uses db.get; cart stores Convex Id as-is. */
async function fetchProduct(ctx: QueryCtx, productId: Id<'products'>) {
  try {
    return await ctx.db.get(productId)
  } catch (error) {
    console.error(`[getCart] Failed to fetch product ${productId}:`, error)
    return null
  }
}

export const getCart = query({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
  },
  handler: async (ctx, args) => {
    let cart = null

    if (args.cartId) {
      cart = await ctx.db.get(args.cartId)
    } else if (args.userId !== undefined && args.userId !== null) {
      const userId = args.userId
      cart = await ctx.db
        .query('carts')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .unique()
    }

    if (!cart) return null

    try {
      const itemsWithProducts = await Promise.all(
        cart.items.map(async (item) => {
          const product = await fetchProduct(ctx, item.productId)
          if (!product) return null
          return { ...item, product }
        }),
      )
      const validItems = itemsWithProducts.filter(
        (item): item is NonNullable<typeof item> => item !== null,
      )
      return { ...cart, items: validItems }
    } catch (error) {
      console.error('Failed to fetch products for cart:', error)
      return { ...cart, items: [] }
    }
  },
})

/** Debug: raw cart items only (no product fetch). Use to check if DB has items. */
export const getCartRaw = query({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
  },
  handler: async (ctx, args) => {
    let cart = null
    if (args.cartId) {
      cart = await ctx.db.get(args.cartId)
    } else if (args.userId !== undefined && args.userId !== null) {
      cart = await ctx.db
        .query('carts')
        .withIndex('by_user', (q) => q.eq('userId', args.userId!))
        .unique()
    }
    if (!cart) return { rawItemCount: 0, rawItems: [] }
    return {
      rawItemCount: cart.items.length,
      rawItems: cart.items,
    }
  },
})

export const getCartItemCount = query({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
  },
  handler: async (ctx, args) => {
    let cart = null

    if (args.cartId) {
      // Get cart by ID (for anonymous users)
      cart = await ctx.db.get(args.cartId)
    } else if (args.userId !== undefined && args.userId !== null) {
      // Get cart by userId (for authenticated users)
      const userId = args.userId
      cart = await ctx.db
        .query('carts')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .unique()
    }

    if (!cart) {
      return 0
    }

    return cart.items.reduce((total, item) => total + item.quantity, 0)
  },
})
