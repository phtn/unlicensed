import {v} from 'convex/values'
import {query} from '../_generated/server'
import {orderStatusSchema} from './d'

/**
 * Get order by ID
 */
export const getById = query({
  args: {
    id: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id)
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
    status: orderStatusSchema,
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
    const orders = await ctx.db.query('orders').order('desc').take(limit)

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
      totalSpent: orders.reduce(
        (sum, order) => sum + (order.totalCents ?? 0),
        0,
      ),
      pendingOrders: orders.filter((o) => o.orderStatus === 'pending_payment')
        .length,
      completedOrders: orders.filter((o) => o.orderStatus === 'shipped').length,
      cancelledOrders: orders.filter((o) => o.orderStatus === 'cancelled')
        .length,
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

    const startOfWeek = new Date(now)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfWeekTimestamp = startOfWeek.getTime()

    const startOfMonth = new Date(now)
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const startOfMonthTimestamp = startOfMonth.getTime()

    // Get all orders
    const allOrders = await ctx.db.query('orders').collect()

    // Get all users
    const allUsers = await ctx.db.query('users').collect()

    // Get all products
    const allProducts = await ctx.db.query('products').collect()

    // Calculate sales today (only shipped orders)
    const salesToday = allOrders
      .filter(
        (order) =>
          (order.createdAt ?? 0) >= startOfTodayTimestamp &&
          order.orderStatus === 'shipped',
      )
      .reduce((sum, order) => sum + (order.totalCents ?? 0), 0)

    // Calculate sales this week
    const salesThisWeek = allOrders
      .filter(
        (order) =>
          (order.createdAt ?? 0) >= startOfWeekTimestamp &&
          order.orderStatus === 'shipped',
      )
      .reduce((sum, order) => sum + (order.totalCents ?? 0), 0)

    // Calculate sales this month
    const salesThisMonth = allOrders
      .filter(
        (order) =>
          (order.createdAt ?? 0) >= startOfMonthTimestamp &&
          order.orderStatus === 'shipped',
      )
      .reduce((sum, order) => sum + (order.totalCents ?? 0), 0)

    // Calculate total revenue (all shipped orders)
    const totalRevenue = allOrders
      .filter((order) => order.orderStatus === 'shipped')
      .reduce((sum, order) => sum + (order.totalCents ?? 0), 0)

    // Count pending orders
    const pendingOrdersCount = allOrders.filter(
      (order) => order.orderStatus === 'pending_payment',
    ).length

    // Count cancelled orders
    const cancelledOrdersCount = allOrders.filter(
      (order) => order.orderStatus === 'cancelled',
    ).length

    // Count ongoing deliveries (shipping, awaiting_courier_pickup, or order_processing)
    const ongoingDeliveriesCount = allOrders.filter(
      (order) =>
        order.orderStatus === 'shipping' ||
        order.orderStatus === 'awaiting_courier_pickup' ||
        order.orderStatus === 'order_processing',
    ).length

    // Count shipped orders
    const deliveredOrdersCount = allOrders.filter(
      (order) => order.orderStatus === 'shipped',
    ).length

    // Total orders count
    const totalOrdersCount = allOrders.length

    // Calculate average order value (include all orders)
    const ordersForAOV = allOrders
    const totalRevenueForAOV = ordersForAOV.reduce(
      (sum, order) => sum + (order.totalCents ?? 0),
      0,
    )
    const averageOrderValue =
      ordersForAOV.length > 0
        ? Math.round(totalRevenueForAOV / ordersForAOV.length)
        : 0

    return {
      salesTodayCents: salesToday,
      salesThisWeekCents: salesThisWeek,
      salesThisMonthCents: salesThisMonth,
      totalRevenueCents: totalRevenue,
      pendingOrdersCount,
      cancelledOrdersCount,
      ongoingDeliveriesCount,
      deliveredOrdersCount,
      totalOrdersCount,
      totalUsersCount: allUsers.length,
      totalProductsCount: allProducts.length,
      averageOrderValueCents: averageOrderValue,
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
    const aovData: Array<{value: number}> = []

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
          (order.createdAt ?? 0) >= dayStartTimestamp &&
          (order.createdAt ?? 0) < dayEndTimestamp,
      )

      // Calculate sales for this day (only shipped orders)
      const completedDayOrders = dayOrders.filter(
        (order) => order.orderStatus === 'shipped',
      )

      const daySales = completedDayOrders.reduce(
        (sum, order) => sum + (order.totalCents ?? 0),
        0,
      )

      // Calculate average order value for this day (include all orders)
      const dayOrdersForAOV = dayOrders
      const dayTotalForAOV = dayOrdersForAOV.reduce(
        (sum, order) => sum + (order.totalCents ?? 0),
        0,
      )
      const dayAOV =
        dayOrdersForAOV.length > 0 ? dayTotalForAOV / dayOrdersForAOV.length : 0

      // Count orders for this day
      const dayOrdersCount = dayOrders.length

      // Count deliveries for this day (shipping, awaiting_courier_pickup, or order_processing)
      const dayDeliveriesCount = dayOrders.filter(
        (order) =>
          order.orderStatus === 'shipping' ||
          order.orderStatus === 'awaiting_courier_pickup' ||
          order.orderStatus === 'order_processing',
      ).length

      salesData.push({value: daySales / 100}) // Convert cents to dollars
      ordersData.push({value: dayOrdersCount})
      deliveriesData.push({value: dayDeliveriesCount})
      aovData.push({value: dayAOV / 100}) // Convert cents to dollars for display
    }

    return {
      salesData,
      ordersData,
      deliveriesData,
      aovData,
    }
  },
})
