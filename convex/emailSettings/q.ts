import {v} from 'convex/values'
import {query} from '../_generated/server'

export const listEmailSettings = query({
  args: {},
  handler: async ({db}) => {
    return await db.query('emailSettings').collect()
  },
})

export const getEmailSetting = query({
  args: {
    id: v.id('emailSettings'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getEmailSettingsByIntent = query({
  args: {
    intent: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('emailSettings')
      .withIndex('by_intent', (q) => q.eq('intent', args.intent))
      .collect()
  },
})
