import {v} from 'convex/values'
import {query} from '../_generated/server'

export const getStaff = query({
  handler: async (ctx) => {
    return await ctx.db.query('staff').collect()
  },
})

export const getStaffByEmail = query({
  args: {email: v.string()},
  handler: async (ctx, args) => {
    return await ctx.db
      .query('staff')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique()
  },
})

export const getStaffMember = query({
  args: {id: v.id('staff')},
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})
