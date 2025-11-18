import {v} from 'convex/values'
import {mutation, internalMutation} from '../_generated/server'
import {
  orderStatusSchema,
  paymentSchema,
  shippingSchema,
} from './d'
import {addressSchema} from '../users/d'
import {internal} from '../_generated/api'

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `ORD-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`
}

/**
 * Create a new order from a cart
 */
export const createOrder = mutation({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
    shippingAddress: addressSchema,
    billingAddress: v.optional(addressSchema),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    paymentMethod: v.union(
      v.literal('credit_card'),
      v.literal('debit_card'),
      v.literal('paypal'),
      v.literal('apple_pay'),
      v.literal('google_pay'),
      v.literal('bank_transfer'),
      v.literal('cash'),
      v.literal('other'),
    ),
    customerNotes: v.optional(v.string()),
    // Optional: override calculated totals
    subtotalCents: v.optional(v.number()),
    taxCents: v.optional(v.number()),
    shippingCents: v.optional(v.number()),
    discountCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get cart
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

    // Build order items with product snapshots
    const orderItems = await Promise.all(
      cart.items.map(async (cartItem) => {
        const product = await ctx.db.get(cartItem.productId)
        if (!product) {
          throw new Error(`Product ${cartItem.productId} not found`)
        }

        const denomination = cartItem.denomination || 1
        const unitPriceCents = product.priceCents
        const totalPriceCents = unitPriceCents * denomination * cartItem.quantity

        return {
          productId: cartItem.productId,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.image,
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
    const shippingCents =
      args.shippingCents ??
      (subtotalCents > 5000 ? 0 : 500) // Free shipping over $50
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
      orderNumber: generateOrderNumber(),
      orderStatus: 'pending',
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
      orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
      updatedAt: number
      cancelledAt?: number
      internalNotes?: string
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

    // If payment is completed, update order status to confirmed
    let orderStatus = order.orderStatus
    if (
      args.payment.status === 'completed' &&
      order.orderStatus === 'pending'
    ) {
      orderStatus = 'confirmed'
    }

    await ctx.db.patch(args.orderId, {
      payment: args.payment,
      orderStatus,
      updatedAt: Date.now(),
    })

    // Log payment status change activity
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

    // If shipped, update order status
    let orderStatus = order.orderStatus
    if (args.shipping.shippedAt && order.orderStatus !== 'shipped') {
      orderStatus = 'shipped'
    } else if (
      args.shipping.deliveredAt &&
      order.orderStatus !== 'delivered'
    ) {
      orderStatus = 'delivered'
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

    if (order.orderStatus === 'delivered') {
      throw new Error('Cannot cancel a delivered order')
    }

    const notes = args.reason
      ? `Cancelled: ${args.reason}`
      : 'Order cancelled'
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

