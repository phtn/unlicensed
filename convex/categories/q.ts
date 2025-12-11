import {v} from 'convex/values'
import {query} from '../_generated/server'

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('categories').collect()
    return categories.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export const getCategoryBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
    return category ?? null
  },
})
