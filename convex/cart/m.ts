import {v} from 'convex/values'
import type {MutationCtx} from '../_generated/server'
import {mutation} from '../_generated/server'
import type {Id} from '../_generated/dataModel'

const HOLD_DURATION_MS = 5 * 60 * 1000 // 5 minutes

async function getProductStock(
  ctx: MutationCtx,
  productId: Id<'products'>,
  denomination: number | undefined,
): Promise<number> {
  const product = await ctx.db.get(productId)
  if (!product) return 0
  if (product.stockByDenomination != null && denomination !== undefined) {
    const key = String(denomination)
    return product.stockByDenomination[key] ?? 0
  }
  if (product.stockByDenomination != null) {
    return Object.values(product.stockByDenomination).reduce((a, b) => a + b, 0)
  }
  return product.stock ?? 0
}

async function getHeldQuantity(
  ctx: MutationCtx,
  productId: Id<'products'>,
  denomination: number | undefined,
): Promise<number> {
  const holds = await ctx.db
    .query('productHolds')
    .withIndex('by_product_denom', (q) =>
      q.eq('productId', productId).eq('denomination', denomination),
    )
    .collect()
  const now = Date.now()
  return holds
    .filter((h) => h.expiresAt > now)
    .reduce((sum, h) => sum + h.quantity, 0)
}

async function getOurHold(
  ctx: MutationCtx,
  cartId: Id<'carts'>,
  productId: Id<'products'>,
  denomination: number | undefined,
): Promise<{id: Id<'productHolds'>; quantity: number} | null> {
  const holds = await ctx.db
    .query('productHolds')
    .withIndex('by_cart', (q) => q.eq('cartId', cartId))
    .collect()
  const match = holds.find(
    (h) => h.productId === productId && h.denomination === denomination,
  )
  return match ? {id: match._id, quantity: match.quantity} : null
}

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
      cart = await ctx.db.get(args.cartId)
      if (!cart) {
        throw new Error('Cart not found')
      }
    } else if (args.userId !== undefined && args.userId !== null) {
      cart = await ctx.db
        .query('carts')
        .withIndex('by_user', (q) => q.eq('userId', args.userId ?? null))
        .unique()
    }

    if (!cart) {
      const cartId = await ctx.db.insert('carts', {
        userId: args.userId ?? null,
        items: [],
        updatedAt: Date.now(),
      })
      cart = await ctx.db.get(cartId)
      if (!cart) throw new Error('Failed to create cart')
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId === args.productId &&
        item.denomination === args.denomination,
    )
    const newLineQuantity =
      existingItemIndex >= 0
        ? cart.items[existingItemIndex].quantity + args.quantity
        : args.quantity

    const stock = await getProductStock(ctx, args.productId, args.denomination)
    const heldTotal = await getHeldQuantity(ctx, args.productId, args.denomination)
    const ourHold = await getOurHold(ctx, cart._id, args.productId, args.denomination)
    const available = stock - heldTotal + (ourHold?.quantity ?? 0)
    if (available < newLineQuantity) {
      throw new Error(
        'Not enough stock for this product and size. Try a lower quantity or another size.',
      )
    }

    const expiresAt = Date.now() + HOLD_DURATION_MS
    const cartHolds = await ctx.db
      .query('productHolds')
      .withIndex('by_cart', (q) => q.eq('cartId', cart._id))
      .collect()
    const existingHold = cartHolds.find(
      (h) =>
        h.productId === args.productId &&
        h.denomination === args.denomination,
    )

    if (existingHold) {
      await ctx.db.patch(existingHold._id, {
        quantity: newLineQuantity,
        expiresAt,
      })
    } else {
      await ctx.db.insert('productHolds', {
        cartId: cart._id,
        productId: args.productId,
        denomination: args.denomination,
        quantity: newLineQuantity,
        expiresAt,
      })
    }

    const newItems = [...cart.items]
    if (existingItemIndex >= 0) {
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + args.quantity,
      }
    } else {
      newItems.push({
        productId: args.productId,
        quantity: args.quantity,
        denomination: args.denomination,
      })
    }

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
    const cart = await ctx.db.get(args.cartId)
    if (!cart) {
      throw new Error('Cart not found')
    }

    const existingUserCart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()

    if (existingUserCart) {
      const mergedItems = [...existingUserCart.items]

      for (const item of cart.items) {
        const existingItemIndex = mergedItems.findIndex(
          (existing) =>
            existing.productId === item.productId &&
            existing.denomination === item.denomination,
        )

        if (existingItemIndex >= 0) {
          mergedItems[existingItemIndex] = {
            ...mergedItems[existingItemIndex],
            quantity: mergedItems[existingItemIndex].quantity + item.quantity,
          }
        } else {
          mergedItems.push(item)
        }
      }

      await ctx.db.patch(existingUserCart._id, {
        items: mergedItems,
        updatedAt: Date.now(),
      })

      // Delete all holds for the anonymous cart
      const anonymousHolds = await ctx.db
        .query('productHolds')
        .withIndex('by_cart', (q) => q.eq('cartId', args.cartId))
        .collect()
      for (const hold of anonymousHolds) {
        await ctx.db.delete(hold._id)
      }

      await ctx.db.delete(args.cartId)

      // Create/update holds for the user's cart (merged items) with 5-min expiry
      const expiresAt = Date.now() + HOLD_DURATION_MS
      const existingHolds = await ctx.db
        .query('productHolds')
        .withIndex('by_cart', (q) => q.eq('cartId', existingUserCart._id))
        .collect()
      for (const item of mergedItems) {
        const existing = existingHolds.find(
          (h) =>
            h.productId === item.productId &&
            h.denomination === item.denomination,
        )
        if (existing) {
          await ctx.db.patch(existing._id, {
            quantity: item.quantity,
            expiresAt,
          })
        } else {
          await ctx.db.insert('productHolds', {
            cartId: existingUserCart._id,
            productId: item.productId,
            denomination: item.denomination,
            quantity: item.quantity,
            expiresAt,
          })
        }
      }

      return existingUserCart._id
    } else {
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
        .withIndex('by_user', (q) => q.eq('userId', args.userId ?? null))
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
      newItems.splice(itemIndex, 1)
    } else {
      const stock = await getProductStock(ctx, args.productId, args.denomination)
      const heldTotal = await getHeldQuantity(ctx, args.productId, args.denomination)
      const ourHold = await getOurHold(ctx, cart._id, args.productId, args.denomination)
      const available = stock - heldTotal + (ourHold?.quantity ?? 0)
      if (available < args.quantity) {
        throw new Error(
          'Not enough stock for this product and size. Try a lower quantity or another size.',
        )
      }
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        quantity: args.quantity,
      }
    }

    const existingHold = await ctx.db
      .query('productHolds')
      .withIndex('by_cart', (q) => q.eq('cartId', cart._id))
      .collect()
      .then((holds) =>
        holds.find(
          (h) =>
            h.productId === args.productId &&
            h.denomination === args.denomination,
        ),
      )

    if (args.quantity <= 0) {
      if (existingHold) {
        await ctx.db.delete(existingHold._id)
      }
    } else {
      const expiresAt = Date.now() + HOLD_DURATION_MS
      if (existingHold) {
        await ctx.db.patch(existingHold._id, {
          quantity: args.quantity,
          expiresAt,
        })
      } else {
        await ctx.db.insert('productHolds', {
          cartId: cart._id,
          productId: args.productId,
          denomination: args.denomination,
          quantity: args.quantity,
          expiresAt,
        })
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
        .withIndex('by_user', (q) => q.eq('userId', args.userId ?? null))
        .unique()
    }

    if (!cart) {
      throw new Error('Cart not found')
    }

    const hold = await ctx.db
      .query('productHolds')
      .withIndex('by_cart', (q) => q.eq('cartId', cart._id))
      .collect()
      .then((holds) =>
        holds.find(
          (h) =>
            h.productId === args.productId &&
            h.denomination === args.denomination,
        ),
      )
    if (hold) {
      await ctx.db.delete(hold._id)
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
        .withIndex('by_user', (q) => q.eq('userId', args.userId ?? null))
        .unique()
    }

    if (!cart) {
      return
    }

    const holds = await ctx.db
      .query('productHolds')
      .withIndex('by_cart', (q) => q.eq('cartId', cart!._id))
      .collect()
    for (const hold of holds) {
      await ctx.db.delete(hold._id)
    }

    await ctx.db.patch(cart._id, {
      items: [],
      updatedAt: Date.now(),
    })
  },
})
