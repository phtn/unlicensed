import {v} from 'convex/values'
import {
  getSharedWeightLineQuantity,
  getTotalStock,
  roundStockQuantity,
  usesSharedWeightInventory,
} from '../../lib/productStock'
import type {Doc, Id} from '../_generated/dataModel'
import type {MutationCtx} from '../_generated/server'
import {mutation} from '../_generated/server'
import {isProductCartItem} from './d'

const HOLD_DURATION_MS = 5 * 60 * 1000 // 5 minutes
const INVENTORY_EPSILON = 0.000001

type ProductDoc = Doc<'products'>

function getInventoryAvailabilityKey(
  product: ProductDoc,
  denomination: number | undefined,
): string {
  if (usesSharedWeightInventory(product)) {
    return String(product._id)
  }

  return `${product._id}:${denomination ?? 'default'}`
}

function getRequestedInventoryQuantity(
  product: ProductDoc,
  quantity: number,
  denomination: number | undefined,
): number {
  const sharedWeightQuantity = getSharedWeightLineQuantity(
    product,
    denomination,
    quantity,
  )

  return sharedWeightQuantity ?? quantity
}

async function getProductStock(
  ctx: MutationCtx,
  productId: Id<'products'>,
): Promise<number> {
  const product = await ctx.db.get(productId)
  if (!product) return 0
  return getTotalStock(product)
}

async function getHeldQuantity(
  ctx: MutationCtx,
  product: ProductDoc,
  denomination: number | undefined,
): Promise<number> {
  const holds = usesSharedWeightInventory(product)
    ? await ctx.db
        .query('productHolds')
        .withIndex('by_product', (q) => q.eq('productId', product._id))
        .collect()
    : await ctx.db
        .query('productHolds')
        .withIndex('by_product_denom', (q) =>
          q.eq('productId', product._id).eq('denomination', denomination),
        )
        .collect()
  const now = Date.now()
  return roundStockQuantity(
    holds
      .filter((h) => h.expiresAt > now)
      .reduce(
        (sum, h) =>
          sum +
          getRequestedInventoryQuantity(product, h.quantity, h.denomination),
        0,
      ),
  )
}

async function getOurHold(
  ctx: MutationCtx,
  cartId: Id<'carts'>,
  product: ProductDoc,
  denomination: number | undefined,
): Promise<{
  hold: {id: Id<'productHolds'>; quantity: number} | null
  currentLineReservedQuantity: number
  reservedQuantity: number
}> {
  const holds = await ctx.db
    .query('productHolds')
    .withIndex('by_cart', (q) => q.eq('cartId', cartId))
    .collect()
  const match = holds.find(
    (h) => h.productId === product._id && h.denomination === denomination,
  )
  const relevantHolds = usesSharedWeightInventory(product)
    ? holds.filter((h) => h.productId === product._id)
    : holds.filter(
        (h) => h.productId === product._id && h.denomination === denomination,
      )

  return {
    hold: match ? {id: match._id, quantity: match.quantity} : null,
    currentLineReservedQuantity: match
      ? getRequestedInventoryQuantity(
          product,
          match.quantity,
          match.denomination,
        )
      : 0,
    reservedQuantity: roundStockQuantity(
      relevantHolds.reduce(
        (sum, h) =>
          sum +
          getRequestedInventoryQuantity(product, h.quantity, h.denomination),
        0,
      ),
    ),
  }
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
        isProductCartItem(item) &&
        item.productId === args.productId &&
        item.denomination === args.denomination,
    )
    const existingItem =
      existingItemIndex >= 0 ? cart.items[existingItemIndex] : null
    const newLineQuantity =
      existingItem && isProductCartItem(existingItem)
        ? existingItem.quantity + args.quantity
        : args.quantity

    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error('Product not found')
    }

    const stock = await getProductStock(ctx, args.productId)
    const heldTotal = await getHeldQuantity(ctx, product, args.denomination)
    const ourHold = await getOurHold(ctx, cart._id, product, args.denomination)
    const required = getRequestedInventoryQuantity(
      product,
      newLineQuantity,
      args.denomination,
    )
    const available = stock - heldTotal + ourHold.reservedQuantity
    const nextReservedQuantity =
      ourHold.reservedQuantity - ourHold.currentLineReservedQuantity + required
    if (available + INVENTORY_EPSILON < nextReservedQuantity) {
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
        h.productId === args.productId && h.denomination === args.denomination,
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
      const curr = newItems[existingItemIndex]
      if (isProductCartItem(curr)) {
        newItems[existingItemIndex] = {
          ...curr,
          quantity: curr.quantity + args.quantity,
        }
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

const bundleLineItemSchema = v.object({
  productId: v.id('products'),
  quantity: v.number(),
  denomination: v.number(),
})

export const addBundleToCart = mutation({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
    bundleType: v.string(),
    variationIndex: v.number(),
    bundleItems: v.array(bundleLineItemSchema),
  },
  handler: async (ctx, args) => {
    let cart = null

    if (args.cartId) {
      cart = await ctx.db.get(args.cartId)
      if (!cart) throw new Error('Cart not found')
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

    const products = new Map<Id<'products'>, ProductDoc>()
    for (const bi of args.bundleItems) {
      if (!products.has(bi.productId)) {
        const product = await ctx.db.get(bi.productId)
        if (!product) {
          throw new Error('Product not found')
        }
        products.set(bi.productId, product)
      }
    }

    const requiredByKey = new Map<
      string,
      {
        product: ProductDoc
        denomination: number | undefined
        required: number
      }
    >()

    for (const bi of args.bundleItems) {
      const product = products.get(bi.productId)
      if (!product) {
        throw new Error('Product not found')
      }

      const key = getInventoryAvailabilityKey(product, bi.denomination)
      const required = getRequestedInventoryQuantity(
        product,
        bi.quantity,
        bi.denomination,
      )
      const existing = requiredByKey.get(key)
      requiredByKey.set(key, {
        product,
        denomination: bi.denomination,
        required: roundStockQuantity((existing?.required ?? 0) + required),
      })
    }

    for (const {product, denomination, required} of requiredByKey.values()) {
      const stock = await getProductStock(ctx, product._id)
      const heldTotal = await getHeldQuantity(ctx, product, denomination)
      const ourHold = await getOurHold(ctx, cart._id, product, denomination)
      const available = stock - heldTotal + ourHold.reservedQuantity
      const nextReservedQuantity = ourHold.reservedQuantity + required

      if (available + INVENTORY_EPSILON < nextReservedQuantity) {
        throw new Error(
          'Not enough stock for this product and size. Try a lower quantity or another size.',
        )
      }
    }

    const addQty = new Map<string, number>()
    for (const bi of args.bundleItems) {
      const key = `${bi.productId}-${bi.denomination}`
      addQty.set(key, (addQty.get(key) ?? 0) + bi.quantity)
    }

    const expiresAt = Date.now() + HOLD_DURATION_MS
    const cartHolds = await ctx.db
      .query('productHolds')
      .withIndex('by_cart', (q) => q.eq('cartId', cart._id))
      .collect()

    for (const [key, addQuantity] of addQty) {
      const sepIdx = key.indexOf('-')
      const productId = key.slice(0, sepIdx) as Id<'products'>
      const denomination = Number(key.slice(sepIdx + 1))
      const existingHold = cartHolds.find(
        (h) => h.productId === productId && h.denomination === denomination,
      )
      const newQty = (existingHold?.quantity ?? 0) + addQuantity
      if (existingHold) {
        await ctx.db.patch(existingHold._id, {quantity: newQty, expiresAt})
      } else {
        await ctx.db.insert('productHolds', {
          cartId: cart._id,
          productId,
          denomination,
          quantity: addQuantity,
          expiresAt,
        })
      }
    }

    const newItems = [
      ...cart.items,
      {
        bundleType: args.bundleType,
        variationIndex: args.variationIndex,
        bundleItems: args.bundleItems,
      },
    ]

    await ctx.db.patch(cart._id, {
      items: newItems,
      updatedAt: Date.now(),
    })

    return cart._id
  },
})

export const removeBundleFromCart = mutation({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
    itemIndex: v.number(),
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

    if (!cart) throw new Error('Cart not found')

    const item = cart.items[args.itemIndex]
    if (!item || !('bundleType' in item) || !('bundleItems' in item)) {
      throw new Error('Bundle item not found at index')
    }

    const holds = await ctx.db
      .query('productHolds')
      .withIndex('by_cart', (q) => q.eq('cartId', cart._id))
      .collect()

    for (const bi of item.bundleItems) {
      const hold = holds.find(
        (h) =>
          h.productId === bi.productId && h.denomination === bi.denomination,
      )
      if (hold) {
        const newQty = hold.quantity - bi.quantity
        if (newQty <= 0) {
          await ctx.db.delete(hold._id)
        } else {
          await ctx.db.patch(hold._id, {
            quantity: newQty,
            expiresAt: Date.now() + HOLD_DURATION_MS,
          })
        }
      }
    }

    const newItems = cart.items.filter((_, i) => i !== args.itemIndex)

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
        if (isProductCartItem(item)) {
          const existingItemIndex = mergedItems.findIndex(
            (existing) =>
              isProductCartItem(existing) &&
              existing.productId === item.productId &&
              existing.denomination === item.denomination,
          )

          if (
            existingItemIndex >= 0 &&
            isProductCartItem(mergedItems[existingItemIndex])
          ) {
            mergedItems[existingItemIndex] = {
              ...mergedItems[existingItemIndex],
              quantity: mergedItems[existingItemIndex].quantity + item.quantity,
            }
          } else {
            mergedItems.push(item)
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
      const quantityByProductDenom = new Map<string, number>()
      for (const item of mergedItems) {
        if (isProductCartItem(item)) {
          const key = `${item.productId}-${item.denomination ?? 'def'}`
          quantityByProductDenom.set(
            key,
            (quantityByProductDenom.get(key) ?? 0) + item.quantity,
          )
        } else {
          for (const bi of item.bundleItems) {
            const key = `${bi.productId}-${bi.denomination}`
            quantityByProductDenom.set(
              key,
              (quantityByProductDenom.get(key) ?? 0) + bi.quantity,
            )
          }
        }
      }
      const expiresAt = Date.now() + HOLD_DURATION_MS
      const existingHolds = await ctx.db
        .query('productHolds')
        .withIndex('by_cart', (q) => q.eq('cartId', existingUserCart._id))
        .collect()
      for (const [key, quantity] of quantityByProductDenom) {
        const sepIdx = key.indexOf('-')
        const productIdStr = key.slice(0, sepIdx)
        const denomStr = key.slice(sepIdx + 1)
        const productId = productIdStr as Id<'products'>
        const denomination = denomStr === 'def' ? undefined : Number(denomStr)
        const existing = existingHolds.find(
          (h) =>
            h.productId === productId &&
            (h.denomination ?? undefined) === (denomination ?? undefined),
        )
        if (existing) {
          await ctx.db.patch(existing._id, {quantity, expiresAt})
        } else {
          await ctx.db.insert('productHolds', {
            cartId: existingUserCart._id,
            productId,
            denomination,
            quantity,
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
        isProductCartItem(item) &&
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
      const product = await ctx.db.get(args.productId)
      if (!product) {
        throw new Error('Product not found')
      }

      const stock = await getProductStock(ctx, args.productId)
      const heldTotal = await getHeldQuantity(ctx, product, args.denomination)
      const ourHold = await getOurHold(
        ctx,
        cart._id,
        product,
        args.denomination,
      )
      const required = getRequestedInventoryQuantity(
        product,
        args.quantity,
        args.denomination,
      )
      const available = stock - heldTotal + ourHold.reservedQuantity
      const nextReservedQuantity =
        ourHold.reservedQuantity -
        ourHold.currentLineReservedQuantity +
        required
      if (available + INVENTORY_EPSILON < nextReservedQuantity) {
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
          isProductCartItem(item) &&
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
