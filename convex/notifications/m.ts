import {v} from 'convex/values'
import {mutation} from '../_generated/server'

// Create a notification
export const createNotification = mutation({
  args: {
    uid: v.id('users'), // The user who receives the notification
    fid: v.string(),
    type: v.union(v.literal('follow'), v.literal('message')),
    actorId: v.id('users'), // The user who performed the action
    title: v.string(),
    message: v.string(),
    relatedEntityId: v.union(v.string(), v.null()),
    actionUrl: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    // Prevent self-notifications
    if (args.fid === args.actorId) {
      return null
    }

    // Create the notification
    const notificationId = await ctx.db.insert('notifications', {
      uid: args.uid,
      fid: args.fid,
      type: args.type,
      actorId: args.actorId,
      title: args.title,
      message: args.message,
      readAt: null,
      createdAt: new Date().toISOString(),
      visible: true,
      relatedEntityId: args.relatedEntityId,
      actionUrl: args.actionUrl,
    })

    // Push notify the recipient (best-effort, async).
    const userProfile = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()
    const tokens = userProfile?.fcm?.tokens?.filter((t) => t.length > 0) ?? []
    const token = userProfile?.fcm?.token
    const hasDeclined = userProfile?.fcm?.hasDeclined === true

    const sendTokens = tokens.length > 0 ? tokens : token ? [token] : []
    if (sendTokens.length > 0 && !hasDeclined) {
      const actor =
        args.type === 'message' ? await ctx.db.get(args.actorId) : null
      const url =
        args.actionUrl ??
        (args.type === 'message' && actor?.fid
          ? `/account/chat/${actor.fid}`
          : '/account')

      // for (const token of sendTokens) {
      //   await ctx.scheduler.runAfter(0, api.push.a.sendToToken, {
      //     token,
      //     title: args.title,
      //     body: args.message,
      //     url,
      //   })
      // }
    }

    return notificationId
  },
})

// Mark a notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
    fid: v.string(), // Current user's proId (Firebase UID) to verify ownership
  },
  handler: async (ctx, args) => {
    // Get the notification
    const notification = await ctx.db.get(args.notificationId)

    if (!notification) {
      throw new Error('Notification not found')
    }

    // Get the user by proId
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Verify the notification belongs to the user
    if (notification.fid !== user._id) {
      throw new Error('Unauthorized to mark this notification as read')
    }

    // Mark as read
    await ctx.db.patch(args.notificationId, {
      readAt: new Date().toISOString(),
    })

    return args.notificationId
  },
})

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
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
      throw new Error('User not found')
    }

    // Get all unread notifications for the user
    const unreadNotifications = await ctx.db
      .query('notifications')
      .withIndex('by_uid', (q) => q.eq('uid', user._id))
      .filter((q) =>
        q.and(q.eq(q.field('visible'), true), q.eq(q.field('readAt'), null)),
      )
      .collect()

    // Mark all as read
    const readAt = new Date().toISOString()
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        readAt,
      })
    }

    return unreadNotifications.length
  },
})

// Delete a notification (soft delete)
export const deleteNotification = mutation({
  args: {
    notificationId: v.id('notifications'),
    fid: v.string(), // Current user's proId (Firebase UID) to verify ownership
  },
  handler: async (ctx, args) => {
    // Get the notification
    const notification = await ctx.db.get(args.notificationId)

    if (!notification) {
      throw new Error('Notification not found')
    }

    // Get the user by proId
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Verify the notification belongs to the user
    if (notification.uid !== user._id) {
      throw new Error('Unauthorized to delete this notification')
    }

    // Soft delete by setting visible to false
    await ctx.db.patch(args.notificationId, {
      visible: false,
    })

    return args.notificationId
  },
})
