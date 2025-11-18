import {v} from 'convex/values'
import {mutation, internalMutation} from '../_generated/server'
import {activityTypeSchema, activityMetadataSchema} from './d'

/**
 * Create a new activity log entry
 */
export const createActivity = mutation({
  args: {
    type: activityTypeSchema,
    title: v.string(),
    description: v.optional(v.string()),
    userId: v.optional(v.union(v.id('users'), v.null())),
    orderId: v.optional(v.id('orders')),
    productId: v.optional(v.id('products')),
    categoryId: v.optional(v.id('categories')),
    metadata: v.optional(activityMetadataSchema),
  },
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert('activities', {
      type: args.type,
      title: args.title,
      description: args.description,
      userId: args.userId ?? undefined,
      orderId: args.orderId,
      productId: args.productId,
      categoryId: args.categoryId,
      metadata: args.metadata,
      createdAt: Date.now(),
    })

    return activityId
  },
})

/**
 * Log user signup activity (internal - called via scheduler)
 */
export const logUserSignup = internalMutation({
  args: {
    userId: v.id('users'),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    return await ctx.db.insert('activities', {
      type: 'user_signup',
      title: `New user signed up: ${user.name}`,
      description: `User ${user.email} created an account`,
      userId: args.userId,
      metadata: {
        userName: user.name,
        userEmail: user.email,
      },
      createdAt: Date.now(),
    })
  },
})

/**
 * Log order created activity (internal - called via scheduler)
 */
export const logOrderCreated = internalMutation({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    return await ctx.db.insert('activities', {
      type: 'order_created',
      title: `New order placed: ${order.orderNumber}`,
      description: `Order ${order.orderNumber} was created`,
      userId: order.userId ?? undefined,
      orderId: args.orderId,
      metadata: {
        orderId: args.orderId,
        orderNumber: order.orderNumber,
        orderTotalCents: order.totalCents,
        orderStatus: order.orderStatus,
        paymentMethod: order.payment.method,
        paymentStatus: order.payment.status,
      },
      createdAt: Date.now(),
    })
  },
})

/**
 * Log order status change activity (internal - called via scheduler)
 */
export const logOrderStatusChange = internalMutation({
  args: {
    orderId: v.id('orders'),
    previousStatus: v.string(),
    newStatus: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Map status to activity type
    const statusToActivityType: Record<string, string> = {
      confirmed: 'order_confirmed',
      processing: 'order_processing',
      shipped: 'order_shipped',
      delivered: 'order_delivered',
      cancelled: 'order_cancelled',
      refunded: 'order_refunded',
    }

    const activityType =
      (statusToActivityType[args.newStatus] as any) || 'order_created'

    return await ctx.db.insert('activities', {
      type: activityType as any,
      title: `Order ${order.orderNumber} status changed: ${args.previousStatus} → ${args.newStatus}`,
      description: args.notes || `Order status updated from ${args.previousStatus} to ${args.newStatus}`,
      userId: order.userId ?? undefined,
      orderId: args.orderId,
      metadata: {
        orderId: args.orderId,
        orderNumber: order.orderNumber,
        orderStatus: args.newStatus,
        previousValue: args.previousStatus,
        newValue: args.newStatus,
        notes: args.notes,
      },
      createdAt: Date.now(),
    })
  },
})

/**
 * Log payment status change activity (internal - called via scheduler)
 */
export const logPaymentStatusChange = internalMutation({
  args: {
    orderId: v.id('orders'),
    previousStatus: v.string(),
    newStatus: v.string(),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Map payment status to activity type
    const statusToActivityType: Record<string, string> = {
      pending: 'payment_pending',
      processing: 'payment_processing',
      completed: 'payment_completed',
      failed: 'payment_failed',
      refunded: 'payment_refunded',
      partially_refunded: 'payment_refunded',
    }

    const activityType =
      (statusToActivityType[args.newStatus] as any) || 'payment_pending'

    return await ctx.db.insert('activities', {
      type: activityType as any,
      title: `Payment ${args.newStatus} for order ${order.orderNumber}`,
      description: `Payment status changed from ${args.previousStatus} to ${args.newStatus}`,
      userId: order.userId ?? undefined,
      orderId: args.orderId,
      metadata: {
        orderId: args.orderId,
        orderNumber: order.orderNumber,
        paymentStatus: args.newStatus,
        paymentMethod: order.payment.method,
        paymentAmountCents: order.totalCents,
        transactionId: args.transactionId,
        previousValue: args.previousStatus,
        newValue: args.newStatus,
      },
      createdAt: Date.now(),
    })
  },
})

/**
 * Log shipping update activity (internal - called via scheduler)
 */
export const logShippingUpdate = internalMutation({
  args: {
    orderId: v.id('orders'),
    trackingNumber: v.optional(v.string()),
    carrier: v.optional(v.string()),
    shippingMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    return await ctx.db.insert('activities', {
      type: 'order_shipped',
      title: `Order ${order.orderNumber} shipped`,
      description: args.trackingNumber
        ? `Tracking number: ${args.trackingNumber}`
        : 'Shipping information updated',
      userId: order.userId ?? undefined,
      orderId: args.orderId,
      metadata: {
        orderId: args.orderId,
        orderNumber: order.orderNumber,
        trackingNumber: args.trackingNumber,
        carrier: args.carrier,
        shippingMethod: args.shippingMethod,
      },
      createdAt: Date.now(),
    })
  },
})

/**
 * Log product activity (internal - called via scheduler)
 */
export const logProductActivity = internalMutation({
  args: {
    type: v.union(v.literal('product_created'), v.literal('product_updated')),
    productId: v.id('products'),
    productName: v.optional(v.string()),
    productSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error('Product not found')
    }

    const title =
      args.type === 'product_created'
        ? `New product created: ${product.name}`
        : `Product updated: ${product.name}`

    return await ctx.db.insert('activities', {
      type: args.type,
      title,
      description: `Product ${args.type === 'product_created' ? 'created' : 'updated'}`,
      productId: args.productId,
      metadata: {
        productId: args.productId,
        productName: product.name,
        productSlug: product.slug,
      },
      createdAt: Date.now(),
    })
  },
})

/**
 * Log category activity (internal - called via scheduler)
 */
export const logCategoryActivity = internalMutation({
  args: {
    type: v.union(
      v.literal('category_created'),
      v.literal('category_updated'),
    ),
    categoryId: v.id('categories'),
    categoryName: v.optional(v.string()),
    categorySlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId)
    if (!category) {
      throw new Error('Category not found')
    }

    const title =
      args.type === 'category_created'
        ? `New category created: ${category.name}`
        : `Category updated: ${category.name}`

    return await ctx.db.insert('activities', {
      type: args.type,
      title,
      description: `Category ${args.type === 'category_created' ? 'created' : 'updated'}`,
      categoryId: args.categoryId,
      metadata: {
        categoryId: args.categoryId,
        categoryName: category.name,
        categorySlug: category.slug,
      },
      createdAt: Date.now(),
    })
  },
})

