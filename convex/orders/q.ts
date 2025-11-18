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

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfTodayTimestamp = startOfToday.getTime()

    // Get all orders
    const allOrders = await ctx.db.query('orders').collect()

    // Calculate sales today (only delivered or confirmed orders)
    const salesToday = allOrders
      .filter(
        (order) =>
          order.createdAt >= startOfTodayTimestamp &&
          (order.orderStatus === 'delivered' ||
            order.orderStatus === 'confirmed' ||
            order.orderStatus === 'shipped'),
      )
      .reduce((sum, order) => sum + order.totalCents, 0)

    // Count pending orders
    const pendingOrdersCount = allOrders.filter(
      (order) => order.orderStatus === 'pending',
    ).length

    // Count ongoing deliveries (shipped or processing)
    const ongoingDeliveriesCount = allOrders.filter(
      (order) =>
        order.orderStatus === 'shipped' || order.orderStatus === 'processing',
    ).length

    // Count delivered orders
    const deliveredOrdersCount = allOrders.filter(
      (order) => order.orderStatus === 'delivered',
    ).length

    // Total orders count
    const totalOrdersCount = allOrders.length

    return {
      salesTodayCents: salesToday,
      pendingOrdersCount,
      ongoingDeliveriesCount,
      deliveredOrdersCount,
      totalOrdersCount,
    }
  },
})

/**
 * Get historical chart data for admin dashboard
 * Returns data for the last 20 days
 */
export const getAdminChartData = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const days = 20
    const dayMs = 24 * 60 * 60 * 1000
    
    // Get all orders
    const allOrders = await ctx.db.query('orders').collect()

    // Initialize arrays for the last 20 days
    const salesData: Array<{value: number}> = []
    const ordersData: Array<{value: number}> = []
    const deliveriesData: Array<{value: number}> = []

    // For each of the last 20 days
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now - i * dayMs)
      dayStart.setHours(0, 0, 0, 0)
      const dayStartTimestamp = dayStart.getTime()
      
      const dayEnd = new Date(dayStartTimestamp + dayMs)
      const dayEndTimestamp = dayEnd.getTime()

      // Filter orders for this day
      const dayOrders = allOrders.filter(
        (order) =>
          order.createdAt >= dayStartTimestamp &&
          order.createdAt < dayEndTimestamp,
      )

      // Calculate sales for this day (only delivered, confirmed, or shipped)
      const daySales = dayOrders
        .filter(
          (order) =>
            order.orderStatus === 'delivered' ||
            order.orderStatus === 'confirmed' ||
            order.orderStatus === 'shipped',
        )
        .reduce((sum, order) => sum + order.totalCents, 0)

      // Count orders for this day
      const dayOrdersCount = dayOrders.length

      // Count deliveries for this day (shipped or processing status)
      const dayDeliveriesCount = dayOrders.filter(
        (order) =>
          order.orderStatus === 'shipped' || order.orderStatus === 'processing',
      ).length

      salesData.push({value: daySales / 100}) // Convert cents to dollars
      ordersData.push({value: dayOrdersCount})
      deliveriesData.push({value: dayDeliveriesCount})
    }

    return {
      salesData,
      ordersData,
      deliveriesData,
    }
  },
})

