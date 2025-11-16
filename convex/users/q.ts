import {query} from '../_generated/server'
import {v} from 'convex/values'

export const getCurrentUser = query({
  args: {
    firebaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
      .unique()

    return user
  },
})






