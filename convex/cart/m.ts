import {v} from 'convex/values'
import {mutation} from '../_generated/server'

export const addToCart = mutation({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
    productId: v.id('products'),
    quantity: v.number(),
    denomination: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let cart = null

    // Get or create cart
    if (args.cartId) {
      // Get cart by ID (for anonymous users)
      cart = await ctx.db.get(args.cartId)
      if (!cart) {
        throw new Error('Cart not found')
      }
    } else if (args.userId !== undefined && args.userId !== null) {
      // Get cart by userId (for authenticated users)
      cart = await ctx.db
        .query('carts')
        .withIndex('by_user', (q) => q.eq('userId', null))
        .unique()
    }

    // Create new cart if it doesn't exist
    if (!cart) {
      const cartId = await ctx.db.insert('carts', {
        userId: args.userId ?? null,
        items: [],
        updatedAt: Date.now(),
      })
      cart = await ctx.db.get(cartId)
      if (!cart) throw new Error('Failed to create cart')
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId === args.productId &&
        item.denomination === args.denomination,
    )

    const newItems = [...cart.items]

    if (existingItemIndex >= 0) {
      // Update quantity
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + args.quantity,
      }
    } else {
      // Add new item
      newItems.push({
        productId: args.productId,
        quantity: args.quantity,
        denomination: args.denomination,
      })
    }

    // Update cart
    await ctx.db.patch(cart._id, {
      items: newItems,
      updatedAt: Date.now(),
    })

    return cart._id
  },
})

/**
 * Update cart userId and clear cartId cookie when user authenticates
 */
export const updateCartUserId = mutation({
  args: {
    cartId: v.id('carts'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get the anonymous cart
    const cart = await ctx.db.get(args.cartId)
    if (!cart) {
      throw new Error('Cart not found')
    }

    // Check if user already has a cart
    const existingUserCart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()

    if (existingUserCart) {
      // Merge carts: add items from anonymous cart to user's existing cart
      const mergedItems = [...existingUserCart.items]

      for (const item of cart.items) {
        const existingItemIndex = mergedItems.findIndex(
          (existing) =>
            existing.productId === item.productId &&
            existing.denomination === item.denomination,
        )

        if (existingItemIndex >= 0) {
          // Update quantity
          mergedItems[existingItemIndex] = {
            ...mergedItems[existingItemIndex],
            quantity: mergedItems[existingItemIndex].quantity + item.quantity,
          }
        } else {
          // Add new item
          mergedItems.push(item)
        }
      }

      // Update existing user cart with merged items
      await ctx.db.patch(existingUserCart._id, {
        items: mergedItems,
        updatedAt: Date.now(),
      })

      // Delete anonymous cart
      await ctx.db.delete(args.cartId)

      return existingUserCart._id
    } else {
      // Update anonymous cart with userId
      await ctx.db.patch(args.cartId, {
        userId: args.userId,
        updatedAt: Date.now(),
      })

      return args.cartId
    }
  },
})

export const updateCartItem = mutation({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
    productId: v.id('products'),
    quantity: v.number(),
    denomination: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let cart = null

    if (args.cartId) {
      cart = await ctx.db.get(args.cartId)
    } else if (args.userId !== undefined && args.userId !== null) {
      cart = await ctx.db
        .query('carts')
        .withIndex('by_user', (q) => q.eq('userId', null))
        .unique()
    }

    if (!cart) {
      throw new Error('Cart not found')
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId === args.productId &&
        item.denomination === args.denomination,
    )

    if (itemIndex < 0) {
      throw new Error('Item not found in cart')
    }

    const newItems = [...cart.items]
    if (args.quantity <= 0) {
      // Remove item
      newItems.splice(itemIndex, 1)
    } else {
      // Update quantity
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        quantity: args.quantity,
      }
    }

    await ctx.db.patch(cart._id, {
      items: newItems,
      updatedAt: Date.now(),
    })

    return cart._id
  },
})

export const removeFromCart = mutation({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
    productId: v.id('products'),
    denomination: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let cart = null

    if (args.cartId) {
      cart = await ctx.db.get(args.cartId)
    } else if (args.userId !== undefined && args.userId !== null) {
      cart = await ctx.db
        .query('carts')
        .withIndex('by_user', (q) => q.eq('userId', null))
        .unique()
    }

    if (!cart) {
      throw new Error('Cart not found')
    }

    const newItems = cart.items.filter(
      (item) =>
        !(
          item.productId === args.productId &&
          item.denomination === args.denomination
        ),
    )

    await ctx.db.patch(cart._id, {
      items: newItems,
      updatedAt: Date.now(),
    })

    return cart._id
  },
})

export const clearCart = mutation({
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
        .withIndex('by_user', (q) => q.eq('userId', null))
        .unique()
    }

    if (!cart) {
      return
    }

    await ctx.db.patch(cart._id, {
      items: [],
      updatedAt: Date.now(),
    })
  },
})
