import {v} from 'convex/values'
import {ensureSlug, slugify} from '../../lib/slug'
import {internal} from '../_generated/api'
import {mutation} from '../_generated/server'
import type {AttributeEntry} from './d'
import {attributeEntrySchema, categorySchema} from './d'

function normalizeAttributeEntries(
  entries: Array<{name: string; slug?: string}> | undefined,
): AttributeEntry[] {
  if (!entries?.length) return []
  return entries
    .map((e) => {
      const name = typeof e.name === 'string' ? e.name.trim() : ''
      if (!name) return null
      const slug =
        typeof e.slug === 'string' && e.slug.trim()
          ? slugify(e.slug.trim())
          : slugify(name)
      return {name, slug: slug || slugify(name)}
    })
    .filter((e): e is AttributeEntry => e !== null && e.slug.length > 0)
}

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
    const strainTypes = normalizeAttributeEntries(args.strainTypes)
    const subcategories = normalizeAttributeEntries(args.subcategories)
    const tiers = normalizeAttributeEntries(args.tiers)
    const bases = normalizeAttributeEntries(args.bases)
    const brands = normalizeAttributeEntries(args.brands)
    const categories = await ctx.db.query('categories').collect()
    const nextOrder =
      categories.reduce(
        (maxOrder, category) => Math.max(maxOrder, category.order ?? -1),
        -1,
      ) + 1

    const categoryId = await ctx.db.insert('categories', {
      ...args,
      order: args.order ?? nextOrder,
      slug,
      benefits,
      strainTypes: strainTypes.length > 0 ? strainTypes : undefined,
      subcategories: subcategories.length > 0 ? subcategories : undefined,
      tiers: tiers.length > 0 ? tiers : undefined,
      bases: bases.length > 0 ? bases : undefined,
      brands: brands.length > 0 ? brands : undefined,
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
    const strainTypes = normalizeAttributeEntries(args.strainTypes)
    const subcategories = normalizeAttributeEntries(args.subcategories)
    const tiers = normalizeAttributeEntries(args.tiers)
    const bases = normalizeAttributeEntries(args.bases)
    const brands = normalizeAttributeEntries(args.brands)
    const {categoryId, ...updateData} = args
    await ctx.db.patch(categoryId, {
      ...updateData,
      benefits,
      strainTypes: strainTypes.length > 0 ? strainTypes : undefined,
      subcategories: subcategories.length > 0 ? subcategories : undefined,
      tiers: tiers.length > 0 ? tiers : undefined,
      bases: bases.length > 0 ? bases : undefined,
      brands: brands.length > 0 ? brands : undefined,
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

export const updateTiers = mutation({
  args: {
    categoryId: v.id('categories'),
    tiers: v.array(attributeEntrySchema),
  },
  handler: async (ctx, {categoryId, tiers}) => {
    const category = await ctx.db.get(categoryId)
    if (!category) {
      throw new Error('Category not found')
    }
    const normalized = normalizeAttributeEntries(tiers)
    await ctx.db.patch(categoryId, {
      tiers: normalized.length > 0 ? normalized : undefined,
    })
    return categoryId
  },
})

export const reorder = mutation({
  args: {
    orderedIds: v.array(v.id('categories')),
  },
  handler: async (ctx, {orderedIds}) => {
    for (let index = 0; index < orderedIds.length; index++) {
      await ctx.db.patch(orderedIds[index], {order: index})
    }

    return {success: true}
  },
})
