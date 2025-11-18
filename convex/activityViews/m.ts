import {v} from 'convex/values'
import {mutation} from '../_generated/server'

/**
 * Mark an activity as viewed by a user
 */
export const markActivityAsViewed = mutation({
  args: {
    activityId: v.id('activities'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Check if view already exists
    const existingView = await ctx.db
      .query('activityViews')
      .withIndex('by_activity_user', (q) =>
        q.eq('activityId', args.activityId).eq('userId', args.userId),
      )
      .unique()

    if (existingView) {
      // Update viewedAt timestamp
      await ctx.db.patch(existingView._id, {
        viewedAt: Date.now(),
      })
      return existingView._id
    }

    // Create new view record
    const viewId = await ctx.db.insert('activityViews', {
      activityId: args.activityId,
      userId: args.userId,
      viewedAt: Date.now(),
    })

    return viewId
  },
})

