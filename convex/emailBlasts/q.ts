import {v} from 'convex/values'
import {internalQuery, query} from '../_generated/server'

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
    emailSettingId: v.optional(v.id('emailSettings')),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 8, 25))

    if (args.emailSettingId) {
      return await ctx.db
        .query('emailBlasts')
        .withIndex('by_email_setting_and_created_at', (q) =>
          q.eq('emailSettingId', args.emailSettingId!),
        )
        .order('desc')
        .take(limit)
    }

    return await ctx.db
      .query('emailBlasts')
      .withIndex('by_created_at')
      .order('desc')
      .take(limit)
  },
})

export const listActive = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 5, 20))
    const queued = await ctx.db
      .query('emailBlasts')
      .withIndex('by_status_and_created_at', (q) => q.eq('status', 'queued'))
      .order('desc')
      .take(limit)
    const sending = await ctx.db
      .query('emailBlasts')
      .withIndex('by_status_and_created_at', (q) => q.eq('status', 'sending'))
      .order('desc')
      .take(limit)

    return [...queued, ...sending]
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, limit)
  },
})

export const getBlast = query({
  args: {
    blastId: v.id('emailBlasts'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.blastId)
  },
})

export const getBlastForProcessing = internalQuery({
  args: {
    blastId: v.id('emailBlasts'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.blastId)
  },
})
