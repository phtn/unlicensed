import {v} from 'convex/values'
import {query} from '../_generated/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('blogs').order('desc').collect()
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('blogs')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
  },
})

export const getById = query({
  args: { id: v.id('blogs') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

