import {v} from 'convex/values'
import {ensureSlug} from '../../lib/slug'
import {mutation} from '../_generated/server'

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.string(),
    heroImage: v.string(),
    highlight: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const slug = ensureSlug(args.slug ?? '', args.name)

    const existing = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()

    if (existing) {
      throw new Error(`Category with slug "${slug}" already exists.`)
    }

    const benefits = (args.benefits ?? [])
      .map((benefit) => benefit.trim())
      .filter((benefit) => benefit.length > 0)

    return await ctx.db.insert('categories', {
      name: args.name.trim(),
      slug,
      description: args.description.trim(),
      heroImage: args.heroImage,
      highlight: args.highlight?.trim() || undefined,
      benefits: benefits.length > 0 ? benefits : undefined,
    })
  },
})

