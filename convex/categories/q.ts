import {v} from 'convex/values'
import {query} from '../_generated/server'

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query('categories')
      .filter((f) => f.neq(f.field('visible'), false))
      .collect()
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

export const getHeroImage = query({
  args: {id: v.id('categories')},
  handler: async (ctx, {id}) => {
    const category = await ctx.db.get(id)
    if (!category || !category.heroImage) {
      return null
    }
    const primaryImage = await ctx.storage.getUrl(category.heroImage)
    return primaryImage
  },
})
