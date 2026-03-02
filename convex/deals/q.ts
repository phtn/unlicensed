import {v} from 'convex/values'
import {query} from '../_generated/server'

/** List deals for the store (enabled only, by order). */
export const listForStore = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('deals')
      .withIndex('by_enabled_order', (q) => q.eq('enabled', true))
      .collect()
  },
})

/** List all deals for admin (by order). */
export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const list = await ctx.db.query('deals').collect()
    return list.sort((a, b) => a.order - b.order)
  },
})

/** Get a single deal by string id (slug). */
export const getById = query({
  args: {id: v.string()},
  handler: async (ctx, {id}) => {
    return await ctx.db
      .query('deals')
      .withIndex('by_deal_slug', (q) => q.eq('id', id))
      .unique()
  },
})
