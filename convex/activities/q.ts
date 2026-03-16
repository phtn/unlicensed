import {v} from 'convex/values'
import type {Doc, Id} from '../_generated/dataModel'
import {query, type QueryCtx} from '../_generated/server'
import {safeGet} from '../utils/id_validation'
import {activityTypeSchema} from './d'

type ActivityDoc = Doc<'activities'>
type ActivityViewDoc = Doc<'activityViews'>
type UserSummary = {
  name: string
  email: string
  photoUrl: string | undefined
}
type ViewerSummary = UserSummary & {
  userId: Id<'users'>
}

const DEFAULT_ACTIVITY_LIMIT = 50
const DEFAULT_VIEWER_LIMIT = 5

const getUserSummaries = async (
  ctx: QueryCtx,
  userIds: Array<Id<'users'>>,
): Promise<Map<string, UserSummary>> => {
  const uniqueUserIds = [...new Set(userIds)]
  const users = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const user = await safeGet(ctx.db, 'users', userId)
      if (!user) return null

      return [
        String(userId),
        {
          name: user.name,
          email: user.email,
          photoUrl: user.photoUrl,
        },
      ] as const
    }),
  )

  return new Map(
    users.filter(
      (entry): entry is readonly [string, UserSummary] => entry !== null,
    ),
  )
}

const getActivitiesForTypes = async (
  ctx: QueryCtx,
  types: Array<ActivityDoc['type']>,
  limit: number,
) => {
  const uniqueTypes = [...new Set(types)]
  const activityGroups = await Promise.all(
    uniqueTypes.map((type) =>
      ctx.db
        .query('activities')
        .withIndex('by_type_created_at', (q) => q.eq('type', type))
        .order('desc')
        .take(limit),
    ),
  )

  return activityGroups
    .flat()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
}

const enrichRecentActivities = async (
  ctx: QueryCtx,
  activities: ActivityDoc[],
  {
    includeUsers,
    includeViewers,
    viewerLimit,
  }: {
    includeUsers: boolean
    includeViewers: boolean
    viewerLimit: number
  },
) => {
  if (!includeUsers && !includeViewers) {
    return activities
  }

  const activityIds = activities.map((activity) => activity._id)
  const viewsByActivity = new Map<string, ActivityViewDoc[]>()
  const viewerCountByActivity = new Map<string, number>()

  if (includeViewers) {
    const activityViewGroups = await Promise.all(
      activityIds.map((activityId) =>
        ctx.db
          .query('activityViews')
          .withIndex('by_activity', (q) => q.eq('activityId', activityId))
          .collect(),
      ),
    )

    activityIds.forEach((activityId, index) => {
      const views = [...(activityViewGroups[index] ?? [])].sort(
        (a, b) => b.viewedAt - a.viewedAt,
      )
      const activityKey = String(activityId)
      viewerCountByActivity.set(activityKey, views.length)
      viewsByActivity.set(activityKey, views.slice(0, viewerLimit))
    })
  }

  const userIds = new Set<Id<'users'>>()

  if (includeUsers) {
    activities.forEach((activity) => {
      if (activity.userId) {
        userIds.add(activity.userId)
      }
    })
  }

  if (includeViewers) {
    viewsByActivity.forEach((views) => {
      views.forEach((view) => {
        userIds.add(view.userId)
      })
    })
  }

  const usersById = await getUserSummaries(ctx, [...userIds])

  return activities.map((activity) => {
    const activityKey = String(activity._id)
    const result: ActivityDoc & {
      user?: UserSummary | null
      viewers?: ViewerSummary[]
      viewerCount?: number
    } = {...activity}

    if (includeUsers) {
      result.user = activity.userId
        ? (usersById.get(String(activity.userId)) ?? null)
        : null
    }

    if (includeViewers) {
      result.viewerCount = viewerCountByActivity.get(activityKey) ?? 0
      result.viewers = (viewsByActivity.get(activityKey) ?? [])
        .map((view) => {
          const user = usersById.get(String(view.userId))
          if (!user) return null

          return {
            userId: view.userId,
            ...user,
          }
        })
        .filter((viewer): viewer is ViewerSummary => viewer !== null)
    }

    return result
  })
}

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
      .withIndex('by_created_at')
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
      .withIndex('by_type_created_at', (q) => q.eq('type', args.type))
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
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
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
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
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
    includeUsers: v.optional(v.boolean()),
    includeViewers: v.optional(v.boolean()),
    viewerLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? DEFAULT_ACTIVITY_LIMIT
    const includeUsers = args.includeUsers ?? true
    const includeViewers = args.includeViewers ?? true
    const viewerLimit = Math.max(1, args.viewerLimit ?? DEFAULT_VIEWER_LIMIT)

    const activities =
      args.types && args.types.length > 0
        ? await getActivitiesForTypes(ctx, args.types, limit)
        : await ctx.db
            .query('activities')
            .withIndex('by_created_at')
            .order('desc')
            .take(limit)

    return await enrichRecentActivities(ctx, activities, {
      includeUsers,
      includeViewers,
      viewerLimit,
    })
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
      .withIndex('by_created_at', (q) => q.gte('createdAt', cutoffTime))
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
