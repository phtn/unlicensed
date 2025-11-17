import {query} from '../_generated/server'
import {v} from 'convex/values'

/**
 * Get order by ID
 */
export const getOrder = query({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    return order
  },
})

/**
 * Get order by order number
 */
export const getOrderByNumber = query({
  args: {
    orderNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query('orders')
      .withIndex('by_order_number', (q) =>
        q.eq('orderNumber', args.orderNumber),
      )
      .unique()

    return order
  },
})

/**
 * Get all orders for a user
 */
export const getUserOrders = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let orders = await ctx.db
      .query('orders')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()

    if (args.limit) {
      orders = orders.slice(0, args.limit)
    }

    return orders
  },
})

/**
 * Get orders by status
 */
export const getOrdersByStatus = query({
  args: {
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('processing'),
      v.literal('shipped'),
      v.literal('delivered'),
      v.literal('cancelled'),
      v.literal('refunded'),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let orders = await ctx.db
      .query('orders')
      .withIndex('by_status', (q) => q.eq('orderStatus', args.status))
      .order('desc')
      .collect()

    if (args.limit) {
      orders = orders.slice(0, args.limit)
    }

    return orders
  },
})

/**
 * Get recent orders (for admin dashboard)
 */
export const getRecentOrders = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const orders = await ctx.db
      .query('orders')
      .order('desc')
      .take(limit)

    return orders
  },
})

/**
 * Get order statistics for a user
 */
export const getUserOrderStats = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalCents, 0),
      pendingOrders: orders.filter((o) => o.orderStatus === 'pending').length,
      completedOrders: orders.filter(
        (o) => o.orderStatus === 'delivered',
      ).length,
      cancelledOrders: orders.filter(
        (o) => o.orderStatus === 'cancelled',
      ).length,
    }

    return stats
  },
})

