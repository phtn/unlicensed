import {v} from 'convex/values'
import type {Id} from '../_generated/dataModel'
import {mutation, type DatabaseWriter} from '../_generated/server'

const markViewed = async (
  db: DatabaseWriter,
  activityId: Id<'activities'>,
  userId: Id<'users'>,
) => {
  const existingView = await db
    .query('activityViews')
    .withIndex('by_activity_user', (q) =>
      q.eq('activityId', activityId).eq('userId', userId),
    )
    .unique()

  if (existingView) {
    return existingView._id
  }

  return await db.insert('activityViews', {
    activityId,
    userId,
    viewedAt: Date.now(),
  })
}

/**
 * Mark an activity as viewed by a user
 */
export const markActivityAsViewed = mutation({
  args: {
    activityId: v.id('activities'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await markViewed(ctx.db, args.activityId, args.userId)
  },
})

/**
 * Mark multiple activities as viewed by a user in a single mutation
 */
export const markActivitiesAsViewed = mutation({
  args: {
    activityIds: v.array(v.id('activities')),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const uniqueActivityIds = [...new Set(args.activityIds)]
    const viewIds = []

    for (const activityId of uniqueActivityIds) {
      viewIds.push(await markViewed(ctx.db, activityId, args.userId))
    }

    return viewIds
  },
})
