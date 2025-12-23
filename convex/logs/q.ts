import {v} from 'convex/values'
import {query} from '../_generated/server'

/**
 * Get logs with pagination
 */
export const getLogs = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('page_visit'),
        v.literal('api_request'),
        v.literal('error'),
        v.literal('action'),
      ),
    ),
    userId: v.optional(v.id('users')),
    path: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50

    // Start with base query
    let logs
    if (args.type) {
      // Use index for type filter
      logs = await ctx.db
        .query('logs')
        .withIndex('by_type', (q) => q.eq('type', args.type!))
        .order('desc')
        .collect()
    } else {
      // Use index for created_at when no type filter
      logs = await ctx.db
        .query('logs')
        .withIndex('by_created_at')
        .order('desc')
        .collect()
    }

    // Apply additional filters in memory
    let filteredLogs = logs

    if (args.userId !== undefined) {
      filteredLogs = filteredLogs.filter((log) => log.userId === args.userId)
    }

    if (args.path) {
      filteredLogs = filteredLogs.filter((log) => log.path.includes(args.path!))
    }

    if (args.startDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt >= args.startDate!)
    }

    if (args.endDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt <= args.endDate!)
    }

    // Apply pagination
    const hasMore = filteredLogs.length > limit
    const results = hasMore ? filteredLogs.slice(0, limit) : filteredLogs

    // Fetch user data for logs that have userId
    const logsWithUsers = await Promise.all(
      results.map(async (log) => {
        if (log.userId) {
          const user = await ctx.db.get(log.userId)
          return {
            ...log,
            user: user
              ? {
                  name: user.name,
                  email: user.email,
                  photoUrl: user.photoUrl,
                }
              : null,
          }
        }
        return {
          ...log,
          user: null,
        }
      }),
    )

    return {
      logs: logsWithUsers,
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : null,
    }
  },
})

/**
 * Get logs by user ID
 */
export const getLogsByUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const logs = await ctx.db
      .query('logs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit)

    return logs
  },
})

/**
 * Get logs by path
 */
export const getLogsByPath = query({
  args: {
    path: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const logs = await ctx.db
      .query('logs')
      .withIndex('by_path', (q) => q.eq('path', args.path))
      .order('desc')
      .take(limit)

    return logs
  },
})

/**
 * Get visit statistics
 */
export const getVisitStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    path: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('logs').withIndex('by_type', (q) => q.eq('type', 'page_visit'))

    const logs = await query.collect()

    // Apply date filters
    let filteredLogs = logs
    if (args.startDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt >= args.startDate!)
    }
    if (args.endDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt <= args.endDate!)
    }
    if (args.path) {
      filteredLogs = filteredLogs.filter((log) => log.path === args.path)
    }

    // Calculate statistics
    const totalVisits = filteredLogs.length
    const uniqueVisitors = new Set(filteredLogs.map((log) => log.ipAddress)).size
    const uniqueUsers = new Set(
      filteredLogs.filter((log) => log.userId).map((log) => log.userId),
    ).size

    // Group by path
    const visitsByPath: Record<string, number> = {}
    filteredLogs.forEach((log) => {
      visitsByPath[log.path] = (visitsByPath[log.path] || 0) + 1
    })

    // Group by device type
    const visitsByDevice: Record<string, number> = {}
    filteredLogs.forEach((log) => {
      const device = log.deviceType || 'unknown'
      visitsByDevice[device] = (visitsByDevice[device] || 0) + 1
    })

    // Group by country
    const visitsByCountry: Record<string, number> = {}
    filteredLogs.forEach((log) => {
      if (log.country) {
        visitsByCountry[log.country] = (visitsByCountry[log.country] || 0) + 1
      }
    })

    return {
      totalVisits,
      uniqueVisitors,
      uniqueUsers,
      visitsByPath,
      visitsByDevice,
      visitsByCountry,
    }
  },
})

