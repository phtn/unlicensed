import {v} from 'convex/values'
import {query} from '../_generated/server'
import {findStaffByEmail} from './lib'

export const getStaff = query({
  handler: async (ctx) => {
    return await ctx.db.query('staff').collect()
  },
})

export const getStaffByEmail = query({
  args: {email: v.string()},
  handler: async (ctx, args) => {
    return await findStaffByEmail(ctx, args.email)
  },
})

export const getStaffMember = query({
  args: {id: v.id('staff')},
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getStaffByPosition = query({
  args: {position: v.string()},
  handler: async (ctx, args) => {
    const all = await ctx.db.query('staff').collect()
    return all.filter(
      (s) => s.position?.toLowerCase() === args.position.toLowerCase(),
    )
  },
})
