import {query} from '../_generated/server'
import {v} from 'convex/values'

/**
 * Get users who viewed a specific activity
 */
export const getActivityViewers = query({
  args: {
    activityId: v.id('activities'),
  },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query('activityViews')
      .withIndex('by_activity', (q) => q.eq('activityId', args.activityId))
      .collect()

    // Fetch user data for each viewer
    const viewers = await Promise.all(
      views.map(async (view) => {
        const user = await ctx.db.get(view.userId)
        if (!user) return null
        return {
          userId: view.userId,
          name: user.name,
          email: user.email,
          photoUrl: user.photoUrl,
          viewedAt: view.viewedAt,
        }
      }),
    )

    return viewers.filter((viewer) => viewer !== null)
  },
})

/**
 * Get all activities with their viewers
 */
export const getActivitiesWithViewers = query({
  args: {
    activityIds: v.array(v.id('activities')),
  },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query('activityViews')
      .filter((q) =>
        q.or(...args.activityIds.map((id) => q.eq(q.field('activityId'), id))),
      )
      .collect()

    // Group views by activityId
    const viewsByActivity = new Map<string, typeof views>()
    views.forEach((view) => {
      const activityId = view.activityId
      if (!viewsByActivity.has(activityId)) {
        viewsByActivity.set(activityId, [])
      }
      viewsByActivity.get(activityId)!.push(view)
    })

    // Fetch user data for each viewer
    const result = new Map<
      string,
      Array<{
        userId: string
        name: string
        email: string
        photoUrl?: string
        viewedAt: number
      }>
    >()

    for (const [activityId, activityViews] of viewsByActivity.entries()) {
      const viewers = await Promise.all(
        activityViews.map(async (view) => {
          const user = await ctx.db.get(view.userId)
          if (!user) return null
          return {
            userId: view.userId,
            name: user.name,
            email: user.email,
            photoUrl: user.photoUrl,
            viewedAt: view.viewedAt,
          }
        }),
      )
      result.set(activityId, viewers.filter((v) => v !== null) as any)
    }

    return result
  },
})


