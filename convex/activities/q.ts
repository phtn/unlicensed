import {v} from 'convex/values'
import {Id} from '../_generated/dataModel'
import {query} from '../_generated/server'
import {activityTypeSchema} from './d'
import {safeGet} from '../utils/id_validation'

/**
 * Get all activities (for admin dashboard)
 */
export const getAllActivities = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100
    const activities = await ctx.db
      .query('activities')
      .order('desc')
      .take(limit)

    return activities
  },
})

/**
 * Get activities by type
 */
export const getActivitiesByType = query({
  args: {
    type: activityTypeSchema,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100
    const activities = await ctx.db
      .query('activities')
      .filter((q) => q.eq(q.field('type'), args.type))
      .order('desc')
      .take(limit)

    return activities
  },
})

/**
 * Get activities for a specific user
 */
export const getUserActivities = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100
    const activities = await ctx.db
      .query('activities')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .take(limit)

    return activities
  },
})

/**
 * Get activities for a specific order
 */
export const getOrderActivities = query({
  args: {
    orderId: v.id('orders'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const activities = await ctx.db
      .query('activities')
      .filter((q) => q.eq(q.field('orderId'), args.orderId))
      .order('desc')
      .take(limit)

    return activities
  },
})

/**
 * Get recent activities (for admin dashboard) with user data
 */
export const getRecentActivities = query({
  args: {
    limit: v.optional(v.number()),
    types: v.optional(v.array(activityTypeSchema)),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50

    let activities
    if (args.types && args.types.length > 0) {
      // Filter by types if provided - collect all and filter
      const allActivities = await ctx.db.query('activities').collect()
      activities = allActivities
        .filter((activity) => args.types!.includes(activity.type))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit)
    } else {
      activities = await ctx.db.query('activities').order('desc').take(limit)
    }

    // Fetch user data for activities that have userId
    // Validate userId from database before using in get()
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        if (activity.userId) {
          const user = await safeGet(ctx.db, 'users', activity.userId)
          return {
            ...activity,
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
          ...activity,
          user: null,
        }
      }),
    )

    // Fetch viewers for all activities
    const activityIds = activitiesWithUsers.map((a) => a._id)
    let views: Array<{
      _id: Id<'activityViews'>
      _creationTime: number
      activityId: Id<'activities'>
      userId: Id<'users'>
      viewedAt: number
    }> = []

    if (activityIds.length > 0) {
      // Fetch all views and filter in memory (Convex doesn't support dynamic or queries)
      const allViews = await ctx.db.query('activityViews').collect()
      views = allViews.filter((view) => activityIds.includes(view.activityId))
    }

    // Group views by activityId and fetch user data
    const viewsByActivity = new Map<string, typeof views>()
    views.forEach((view) => {
      const activityId = view.activityId
      const key = activityId as string
      if (!viewsByActivity.has(key)) {
        viewsByActivity.set(key, [])
      }
      viewsByActivity.get(key)!.push(view)
    })

    const activitiesWithViewers = await Promise.all(
      activitiesWithUsers.map(async (activity) => {
        const activityViews = viewsByActivity.get(activity._id as string) || []
        const viewers = await Promise.all(
          activityViews.map(async (view) => {
            // Validate userId from database before using in get()
            const user = await safeGet(ctx.db, 'users', view.userId)
            if (!user) return null
            return {
              userId: view.userId,
              name: user.name,
              email: user.email,
              photoUrl: user.photoUrl,
            }
          }),
        )
        return {
          ...activity,
          viewers: viewers.filter((v) => v !== null),
        }
      }),
    )

    return activitiesWithViewers
  },
})

/**
 * Get activity statistics for admin dashboard
 */
export const getActivityStats = query({
  args: {
    days: v.optional(v.number()), // Number of days to look back (default: 7)
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000

    const allActivities = await ctx.db
      .query('activities')
      .filter((q) => q.gte(q.field('createdAt'), cutoffTime))
      .collect()

    const stats = {
      totalActivities: allActivities.length,
      userSignups: allActivities.filter((a) => a.type === 'user_signup').length,
      ordersCreated: allActivities.filter((a) => a.type === 'order_created')
        .length,
      ordersDelivered: allActivities.filter((a) => a.type === 'order_delivered')
        .length,
      paymentsCompleted: allActivities.filter(
        (a) => a.type === 'payment_completed',
      ).length,
      byType: {} as Record<string, number>,
    }

    // Count by type
    allActivities.forEach((activity) => {
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1
    })

    return stats
  },
})
