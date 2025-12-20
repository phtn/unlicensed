import {v} from 'convex/values'
import {query} from '../_generated/server'

export const listCouriers = query({
  handler: async (ctx) => {
    return await ctx.db.query('couriers').collect()
  },
})

export const getActiveCouriers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('couriers')
      .withIndex('by_active', (q) => q.eq('active', true))
      .collect()
  },
})

export const getCourierById = query({
  args: {id: v.id('couriers')},
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getCourierByCode = query({
  args: {code: v.string()},
  handler: async (ctx, args) => {
    return await ctx.db
      .query('couriers')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
  },
})

