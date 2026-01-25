import {v} from 'convex/values'
import {query} from '../_generated/server'
import {safeGet} from '../utils/id_validation'

export const getCart = query({
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
      return null
    }

    // Fetch product details for each cart item
    // Validate productId from database before using in get()
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await safeGet(ctx.db, 'products', item.productId)
        if (!product) {
          return null
        }
        return {
          ...item,
          product,
        }
      }),
    )

    // Filter out null items (products that no longer exist)
    const validItems = itemsWithProducts.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    )

    return {
      ...cart,
      items: validItems,
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
