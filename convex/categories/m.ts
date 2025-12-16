import {v} from 'convex/values'
import {ensureSlug} from '../../lib/slug'
import {mutation} from '../_generated/server'
import {internal} from '../_generated/api'

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.string(),
    heroImage: v.string(),
    visible: v.optional(v.boolean()),
    highlight: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    units: v.optional(v.array(v.string())),
    denominations: v.optional(v.array(v.number())),
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

    const categoryId = await ctx.db.insert('categories', {
      name: args.name.trim(),
      slug,
      description: args.description.trim(),
      heroImage: args.heroImage,
      visible: args.visible ?? false,
      highlight: args.highlight?.trim() || undefined,
      benefits: benefits.length > 0 ? benefits : undefined,
      units: args.units && args.units.length > 0 ? args.units : undefined,
      denominations:
        args.denominations && args.denominations.length > 0
          ? args.denominations
          : undefined,
    })

    // Log category created activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logCategoryActivity, {
      type: 'category_created',
      categoryId,
      categoryName: args.name.trim(),
      categorySlug: slug,
    })

    return categoryId
  },
})

export const update = mutation({
  args: {
    categoryId: v.id('categories'),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.string(),
    heroImage: v.string(),
    visible: v.optional(v.boolean()),
    highlight: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    units: v.optional(v.array(v.string())),
    denominations: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId)
    if (!category) {
      throw new Error('Category not found')
    }

    const slug = ensureSlug(args.slug ?? '', args.name)

    // Check if slug is being changed and conflicts with another category
    if (slug !== category.slug) {
      const existing = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .unique()

      if (existing) {
        throw new Error(`Category with slug "${slug}" already exists.`)
      }
    }

    const benefits = (args.benefits ?? [])
      .map((benefit) => benefit.trim())
      .filter((benefit) => benefit.length > 0)

    await ctx.db.patch(args.categoryId, {
      name: args.name.trim(),
      slug,
      description: args.description.trim(),
      heroImage: args.heroImage,
      visible: args.visible ?? false,
      highlight: args.highlight?.trim() || undefined,
      benefits: benefits.length > 0 ? benefits : undefined,
      units: args.units && args.units.length > 0 ? args.units : undefined,
      denominations:
        args.denominations && args.denominations.length > 0
          ? args.denominations
          : undefined,
    })

    // Log category updated activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logCategoryActivity, {
      type: 'category_updated',
      categoryId: args.categoryId,
      categoryName: args.name.trim(),
      categorySlug: slug,
    })

    return args.categoryId
  },
})

export const purgeTestCategories = mutation({
  handler: async ({db}) => {
    const allItems = await db.query('categories').collect()
    const itemsToDelete = allItems.filter((item) =>
      item.slug.startsWith('test'),
    )
    for (const item of itemsToDelete) {
      await db.delete(item._id)
    }
    return itemsToDelete.length
  },
})
