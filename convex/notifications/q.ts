import {v} from 'convex/values'
import {query} from '../_generated/server'

// Get all notifications for a user
export const getNotifications = query({
  args: {
    fid: v.string(), // Current user's proId (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get the user by proId
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()

    if (!user) {
      return []
    }

    // Get all notifications for the user
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_uid', (q) => q.eq('uid', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .order('desc')
      .collect()

    // Get actor user details for each notification
    const notificationsWithActors = await Promise.all(
      notifications.map(async (notification) => {
        const actor = await ctx.db.get(notification.actorId)
        return {
          ...notification,
          actor,
        }
      }),
    )

    return notificationsWithActors
  },
})

// Get unread notification count
export const getUnreadCount = query({
  args: {
    fid: v.string(), // Current user's proId (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get the user by proId
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()

    if (!user) {
      return 0
    }

    // Get all unread notifications for the user
    const unreadNotifications = await ctx.db
      .query('notifications')
      .withIndex('by_uid', (q) => q.eq('uid', user._id))
      .filter((q) =>
        q.and(q.eq(q.field('visible'), true), q.eq(q.field('readAt'), null)),
      )
      .collect()

    return unreadNotifications.length
  },
})

// Get recent notifications (last N)
export const getRecentNotifications = query({
  args: {
    fid: v.string(), // Current user's proId (Firebase UID)
    limit: v.optional(v.number()), // Number of notifications to return
  },
  handler: async (ctx, args) => {
    // Get the user by proId
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()

    if (!user) {
      return []
    }

    const limit = args.limit || 10

    // Get recent notifications for the user, ordered by creation time
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_uid', (q) => q.eq('uid', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .order('desc')
      .take(limit)

    // Get actor user details and profile for each notification
    const notificationsWithActors = await Promise.all(
      notifications.map(async (notification) => {
        const actor = await ctx.db.get(notification.actorId)
        // Get actor's userProfile to access username and cardId
        const actorProfile = actor ? await ctx.db.get('users', actor._id) : null
        return {
          ...notification,
          actor: actor
            ? {
                ...actor,
                username: actorProfile?.name || null,
              }
            : null,
        }
      }),
    )

    return notificationsWithActors
  },
})
