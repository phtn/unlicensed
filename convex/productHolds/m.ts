import {internalMutation} from '../_generated/server'

/**
 * Delete all product holds that have expired.
 * Called by cron every minute.
 */
export const deleteExpiredHolds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const expired = await ctx.db
      .query('productHolds')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .take(500)
    for (const hold of expired) {
      await ctx.db.delete(hold._id)
    }
  },
})
