import {v} from 'convex/values'
import type {Id} from '../_generated/dataModel'
import {internal} from '../_generated/api'
import type {MutationCtx} from '../_generated/server'
import {internalMutation, mutation} from '../_generated/server'
import {addressSchema} from '../users/d'
import {
  orderStatusSchema,
  paymentMethodSchema,
  paymentSchema,
  shippingSchema,
} from './d'

async function getProductStockForOrder(
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

async function getHeldQuantityForOrder(
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

async function getOurHoldForOrder(
  ctx: MutationCtx,
  cartId: Id<'carts'>,
  productId: Id<'products'>,
  denomination: number | undefined,
): Promise<number> {
  const holds = await ctx.db
    .query('productHolds')
    .withIndex('by_cart', (q) => q.eq('cartId', cartId))
    .collect()
  const match = holds.find(
    (h) => h.productId === productId && h.denomination === denomination,
  )
  return match?.quantity ?? 0
}

/**
 * Create a new order from a cart
 */
export const createOrder = mutation({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
    orderNumber: v.string(),
    uuid: v.string(),
    shippingAddress: addressSchema,
    billingAddress: v.optional(addressSchema),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    paymentMethod: paymentMethodSchema,
    customerNotes: v.optional(v.string()),
    // Optional: override calculated totals
    subtotalCents: v.optional(v.number()),
    taxCents: v.optional(v.number()),
    shippingCents: v.optional(v.number()),
    discountCents: v.optional(v.number()),
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

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty or not found')
    }

    for (const item of cart.items) {
      const stock = await getProductStockForOrder(ctx, item.productId, item.denomination)
      const heldTotal = await getHeldQuantityForOrder(ctx, item.productId, item.denomination)
      const ourHold = await getOurHoldForOrder(ctx, cart._id, item.productId, item.denomination)
      const available = stock - heldTotal + ourHold
      if (available < item.quantity) {
        const product = await ctx.db.get(item.productId)
        const name = product?.name ?? 'Product'
        throw new Error(
          `${name} is no longer available in the requested quantity. Please update your cart.`,
        )
      }
    }

    // Build order items with product snapshots.
    // Use db.get directly; cart stores Convex product IDs as-is.
    const orderItems = await Promise.all(
      cart.items.map(async (cartItem) => {
        const product = await ctx.db.get(cartItem.productId)
        if (!product) {
          throw new Error(`Product ${cartItem.productId} not found`)
        }

        const denomination = cartItem.denomination || 1
        const unitPriceCents = product.priceCents ?? 0
        const totalPriceCents =
          unitPriceCents * denomination * cartItem.quantity

        // Convert storage ID to URL if needed
        let productImageUrl = ''
        if (product.image) {
          productImageUrl = (await ctx.storage.getUrl(product.image)) ?? ''
        }

        return {
          productId: cartItem.productId,
          productName: product.name ?? '',
          productSlug: product.slug ?? '',
          productImage: productImageUrl,
          quantity: cartItem.quantity,
          denomination: cartItem.denomination,
          unitPriceCents,
          totalPriceCents,
        }
      }),
    )

    // Calculate totals
    const subtotalCents =
      args.subtotalCents ??
      orderItems.reduce((sum, item) => sum + item.totalPriceCents, 0)

    const taxCents = args.taxCents ?? Math.round(subtotalCents * 0.1) // 10% tax
    const shippingCents = args.shippingCents ?? (subtotalCents > 5000 ? 0 : 500) // Free shipping over $50
    const discountCents = args.discountCents ?? 0

    const totalCents = subtotalCents + taxCents + shippingCents - discountCents

    // Create payment object
    const payment = {
      method: args.paymentMethod,
      status: 'pending' as const,
    }

    // Create order
    const orderId = await ctx.db.insert('orders', {
      userId: args.userId ?? null,
      orderNumber: args.orderNumber,
      uuid: args.uuid,
      orderStatus: 'pending_payment',
      items: orderItems,
      subtotalCents,
      taxCents,
      shippingCents,
      discountCents: discountCents > 0 ? discountCents : undefined,
      totalCents,
      shippingAddress: args.shippingAddress,
      billingAddress: args.billingAddress,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      payment,
      customerNotes: args.customerNotes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Delete all holds for this cart (items are now in the order)
    const holds = await ctx.db
      .query('productHolds')
      .withIndex('by_cart', (q) => q.eq('cartId', cart._id))
      .collect()
    for (const hold of holds) {
      await ctx.db.delete(hold._id)
    }

    // Log order created activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logOrderCreated, {
      orderId,
    })

    return orderId
  },
})

/**
 * Update order status
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id('orders'),
    status: orderStatusSchema,
    internalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    const updates: {
      orderStatus: typeof args.status
      updatedAt: number
      cancelledAt?: number
      internalNotes?: string
      shipping?: typeof order.shipping
    } = {
      orderStatus: args.status,
      updatedAt: Date.now(),
    }

    if (args.status === 'cancelled' && order.orderStatus !== 'cancelled') {
      updates.cancelledAt = Date.now()
    }

    if (args.internalNotes) {
      updates.internalNotes = args.internalNotes
    }

    if (args.status === 'delivered' && !order.shipping?.deliveredAt) {
      updates.shipping = {
        ...order.shipping,
        deliveredAt: Date.now(),
      }
    }

    await ctx.db.patch(args.orderId, updates)

    // Log order status change activity
    await ctx.scheduler.runAfter(
      0,
      internal.activities.m.logOrderStatusChange,
      {
        orderId: args.orderId,
        previousStatus: order.orderStatus,
        newStatus: args.status,
        notes: args.internalNotes,
      },
    )

    return args.orderId
  },
})

/**
 * Update payment information
 */
export const updatePayment = mutation({
  args: {
    orderId: v.id('orders'),
    payment: paymentSchema,
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }
    const didPaymentStatusChange = order.payment.status !== args.payment.status

    // If payment is completed, update order status to order_processing
    let orderStatus = order.orderStatus
    const wasPaymentCompleted =
      args.payment.status === 'completed' &&
      order.payment.status !== 'completed'

    if (wasPaymentCompleted && order.orderStatus === 'pending_payment') {
      orderStatus = 'order_processing'
    }

    // Update payment with paidAt timestamp if completing
    const paymentUpdate = {
      ...args.payment,
      paidAt:
        wasPaymentCompleted && !args.payment.paidAt
          ? Date.now()
          : args.payment.paidAt,
    }

    await ctx.db.patch(args.orderId, {
      payment: paymentUpdate,
      orderStatus,
      updatedAt: Date.now(),
    })

    // Award points when payment is completed (only if it wasn't already completed)
    if (wasPaymentCompleted && order.userId) {
      await ctx.scheduler.runAfter(0, internal.rewards.m.awardPointsFromOrder, {
        orderId: args.orderId,
      })
    }

    // Deduct stock when payment is completed (only on paid orders)
    if (wasPaymentCompleted) {
      await ctx.scheduler.runAfter(0, internal.orders.m.deductStockForOrder, {
        orderId: args.orderId,
      })
    }

    // Deduct points when payment is refunded
    const wasRefunded =
      (args.payment.status === 'refunded' ||
        args.payment.status === 'partially_refunded') &&
      order.payment.status !== 'refunded' &&
      order.payment.status !== 'partially_refunded'

    if (wasRefunded && order.userId && order.pointsEarned) {
      await ctx.scheduler.runAfter(
        0,
        internal.rewards.m.deductPointsFromRefund,
        {
          orderId: args.orderId,
        },
      )
    }

    // Log payment status change activity only when status actually changed
    if (didPaymentStatusChange) {
      await ctx.scheduler.runAfter(
        0,
        internal.activities.m.logPaymentStatusChange,
        {
          orderId: args.orderId,
          previousStatus: order.payment.status,
          newStatus: args.payment.status,
          transactionId: args.payment.transactionId,
        },
      )
    }

    return args.orderId
  },
})

/**
 * Update shipping information
 */
export const updateShipping = mutation({
  args: {
    orderId: v.id('orders'),
    shipping: shippingSchema,
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Keep order status in sync with shipping milestones.
    let orderStatus = order.orderStatus
    if (args.shipping.deliveredAt && order.orderStatus !== 'delivered') {
      orderStatus = 'delivered'
    } else if (
      args.shipping.shippedAt &&
      order.orderStatus !== 'shipped' &&
      order.orderStatus !== 'delivered'
    ) {
      orderStatus = 'shipped'
    }

    await ctx.db.patch(args.orderId, {
      shipping: args.shipping,
      orderStatus,
      updatedAt: Date.now(),
    })

    // Log shipping update activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logShippingUpdate, {
      orderId: args.orderId,
      trackingNumber: args.shipping.trackingNumber,
      carrier: args.shipping.carrier,
      shippingMethod: args.shipping.method,
    })

    return args.orderId
  },
})

/**
 * Add internal notes to an order
 */
export const addInternalNotes = mutation({
  args: {
    orderId: v.id('orders'),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    const existingNotes = order.internalNotes || ''
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${new Date().toISOString()}: ${args.notes}`
      : `${new Date().toISOString()}: ${args.notes}`

    await ctx.db.patch(args.orderId, {
      internalNotes: updatedNotes,
      updatedAt: Date.now(),
    })

    return args.orderId
  },
})

/**
 * Update order courier
 */
export const updateCourier = mutation({
  args: {
    orderId: v.id('orders'),
    courierId: v.optional(v.union(v.id('couriers'), v.null())),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    let nextCourierAccountId = order.courierAccountId

    // Validate courier exists if provided and keep account id only if valid for that courier
    if (args.courierId) {
      const courier = await ctx.db.get(args.courierId)
      if (!courier) {
        throw new Error('Courier not found')
      }

      const accountIds = new Set((courier.accounts ?? []).map((account) => account.id))
      if (
        !nextCourierAccountId ||
        !accountIds.has(nextCourierAccountId)
      ) {
        nextCourierAccountId = undefined
      }
    } else {
      nextCourierAccountId = undefined
    }

    await ctx.db.patch(args.orderId, {
      courier: args.courierId ?? undefined,
      courierAccountId: nextCourierAccountId,
      updatedAt: Date.now(),
    })

    return args.orderId
  },
})

/**
 * Update order courier account
 */
export const updateCourierAccount = mutation({
  args: {
    orderId: v.id('orders'),
    courierAccountId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    if (!args.courierAccountId) {
      await ctx.db.patch(args.orderId, {
        courierAccountId: undefined,
        updatedAt: Date.now(),
      })
      return args.orderId
    }

    if (!order.courier) {
      throw new Error('Assign a courier before selecting an account')
    }

    const courier = await ctx.db.get(order.courier)
    if (!courier) {
      throw new Error('Assigned courier not found')
    }

    const accountExists = (courier.accounts ?? []).some(
      (account) => account.id === args.courierAccountId,
    )

    if (!accountExists) {
      throw new Error('Courier account not found for assigned courier')
    }

    await ctx.db.patch(args.orderId, {
      courierAccountId: args.courierAccountId,
      updatedAt: Date.now(),
    })

    return args.orderId
  },
})

/**
 * Cancel an order
 */
export const cancelOrder = mutation({
  args: {
    orderId: v.id('orders'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    if (order.orderStatus === 'cancelled') {
      throw new Error('Order is already cancelled')
    }

    if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
      throw new Error('Cannot cancel a shipped or delivered order')
    }

    const notes = args.reason ? `Cancelled: ${args.reason}` : 'Order cancelled'
    const existingNotes = order.internalNotes || ''
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${new Date().toISOString()}: ${notes}`
      : `${new Date().toISOString()}: ${notes}`

    await ctx.db.patch(args.orderId, {
      orderStatus: 'cancelled',
      cancelledAt: Date.now(),
      internalNotes: updatedNotes,
      updatedAt: Date.now(),
    })

    return args.orderId
  },
})

/**
 * Internal: deduct product stock for a paid order. Called when payment is completed.
 */
export const deductStockForOrder = internalMutation({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) return

    for (const item of order.items) {
      const product = await ctx.db.get(item.productId)
      if (!product) continue

      const denom = item.denomination
      const denomKey = denom !== undefined ? String(denom) : null

      if (product.stockByDenomination != null && denomKey != null) {
        const current = product.stockByDenomination[denomKey] ?? 0
        const next = Math.max(0, current - item.quantity)
        await ctx.db.patch(item.productId, {
          stockByDenomination: {
            ...product.stockByDenomination,
            [denomKey]: next,
          },
        })
      } else {
        const current = product.stock ?? 0
        const next = Math.max(0, current - item.quantity)
        await ctx.db.patch(item.productId, {
          stock: next,
        })
      }
    }
  },
})
