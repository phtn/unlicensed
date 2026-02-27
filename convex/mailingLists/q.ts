import {v} from 'convex/values'
import {query} from '../_generated/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('mailingLists')
      .withIndex('by_created_at')
      .order('desc')
      .collect()
  },
})

export const get = query({
  args: {
    id: v.id('mailingLists'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})
