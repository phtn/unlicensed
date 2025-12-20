import {v} from 'convex/values'
import {ensureSlug} from '../../lib/slug'
import {internal} from '../_generated/api'
import {mutation} from '../_generated/server'
import {categorySchema} from './d'

export const create = mutation({
  args: categorySchema,
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
      ...args,
      slug,
      benefits,
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
    ...categorySchema,
    categoryId: v.id('categories'),
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

    const {categoryId, ...updateData} = args
    await ctx.db.patch(categoryId, {
      ...updateData,
      benefits,
      slug,
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
